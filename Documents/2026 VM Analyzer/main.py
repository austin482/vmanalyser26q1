import time
from config import (
    LARK_DOC_APP_ID, LARK_DOC_APP_SECRET, LARK_DOC_TOKEN,
    LARK_BASE_APP_ID, LARK_BASE_APP_SECRET, LARK_BASE_TOKEN, LARK_TABLE_ID
)
from lark_client import LarkClient
from ai_scorer import AIScorer

def parse_okr_doc(blocks: list) -> list:
    """
    Parses the linear blocks from Lark Doc and extracts OKRs conceptually.
    For this specific document, we look for 'Obj', 'Key Result', 'PIC', 'BU Name'.
    (A more robust parsing depends strictly on document structure, but we will 
    extract all text into a context block for now to ensure it works).
    """
    text_content = []
    for b in blocks:
        # Most text-carrying blocks in Docx have a 'text' element or 
        # an element named after their type (like 'heading1', 'text', 'bullet', etc.)
        # that contains wait... actually, most of them nested within the block object.
        
        # We search specifically for the 'text' key inside whichever child object exists.
        # Common keys: text, heading1, heading2, heading3, heading4, heading5, bullet, ordered, quote, todo
        for key in ["text", "heading1", "heading2", "heading3", "heading4", "heading5", "heading6", "bullet", "ordered", "quote", "todo"]:
            if key in b:
                elements = b.get(key, {}).get("elements", [])
                line = "".join([e.get("text_run", {}).get("content", "") for e in elements])
                if line.strip():
                    text_content.append(line.strip())
                break # Found the text for this block
                
    return "\n".join(text_content)

def extract_text(field_value) -> str:
    """Helper to extract plain text from Bitable fields (Rich Text, User, or lists)."""
    if not field_value:
        return ""
    if isinstance(field_value, str):
        return field_value
    if isinstance(field_value, list):
        text_parts = []
        for item in field_value:
            if isinstance(item, dict) and "text" in item:
                text_parts.append(item["text"])
            elif isinstance(item, str):
                text_parts.append(item)
        return "".join(text_parts).strip()
    if isinstance(field_value, dict):
        # Handle User fields
        if "users" in field_value:
            return ", ".join([u.get("name", "") for u in field_value["users"]])
        if "text" in field_value:
            return field_value["text"]
    return str(field_value)

from concurrent.futures import ThreadPoolExecutor, as_completed

def run_analyzer():
    print("Initializing Lark Clients...")
    lark_doc = LarkClient(LARK_DOC_APP_ID, LARK_DOC_APP_SECRET)
    lark_base = LarkClient(LARK_BASE_APP_ID, LARK_BASE_APP_SECRET)
    scorer = AIScorer()
    
    results = {
        "status": "success",
        "processed": 0,
        "errors": []
    }

    try:
        # 1. Fetch OKR context from Document
        print("Fetching OKR rules from Document...")
        doc_blocks = lark_doc.get_document_blocks(LARK_DOC_TOKEN)
        full_okr_text = parse_okr_doc(doc_blocks)
        
        # 2. Fetch Value Metrics from Base
        print("Fetching Value Metrics from Base...")
        records = lark_base.get_base_records(LARK_BASE_TOKEN, LARK_TABLE_ID)
        
        # 3. Filter pending records
        pending_records = []
        for record in records:
            fields = record.get("fields", {})
            vm_pic = extract_text(fields.get("VM PIC"))
            metric_name = extract_text(fields.get("Metric Name"))
            austina_score = fields.get("Austina Score")
            
            # ONLY scan if the score is truly empty (satisfies 'only scan the new ones')
            if vm_pic and metric_name and (austina_score is None or austina_score == ""):
                pending_records.append(record)

        if not pending_records:
            print("No new pending records to process.")
            return results

        print(f"Starting parallel processing for {len(pending_records)} new records...")
        
        def process_single(record):
            record_id = record.get("record_id")
            fields = record.get("fields", {})
            vm_pic = extract_text(fields.get("VM PIC"))
            vm_bu = extract_text(fields.get("PIC BU"))
            metric_name = extract_text(fields.get("Metric Name"))
            description = extract_text(fields.get("Description"))
            
            print(f"Scoring: {vm_pic} - {metric_name}")
            result = scorer.score_alignment(
                doc_objective="Check matching OKR in context",
                doc_key_result=full_okr_text,
                doc_pic="See Context",
                doc_bu="See Context",
                vm_pic=vm_pic,
                vm_bu=vm_bu,
                vm_metric_name=metric_name,
                vm_description=description
            )
            
            score = result.get("score", 0)
            suggestion = result.get("suggestion", "")
            
            update_fields = {
                "Austina Score": int(score),
                "AI Suggestion": suggestion
            }
            
            success = lark_base.update_base_record(LARK_BASE_TOKEN, LARK_TABLE_ID, record_id, update_fields)
            if success:
                print(f"Updated {record_id} successfully.")
            return success, record_id

        # Use ThreadPool to process 5 at a time
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_record = {executor.submit(process_single, rec): rec for rec in pending_records}
            
            import time
            start_time = time.time()
            
            # Wait for results as they complete
            # We don't use as_completed() because we want to check the timeout frequently
            completed_count = 0
            for future in future_to_record:
                # Check for overall timeout
                if time.time() - start_time > 8.5:
                    print("Reached 8.5s limit. Any pending background tasks will be cut off by Vercel.")
                    break
                
                try:
                    # Give each future a small wait time or check if done
                    success, r_id = future.result(timeout=2.0)
                    if success:
                        results["processed"] += 1
                except Exception as e:
                    # If timeout or crash
                    continue

        results["message"] = f"Processed {results['processed']} records."
        print(f"\nBatch complete. {results['message']}")
    except Exception as e:
        results["status"] = "error"
        results["errors"].append(str(e))
        print(f"Fatal Error: {e}")
    
    return results

if __name__ == "__main__":
    run_analyzer()
