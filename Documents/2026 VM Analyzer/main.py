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
        try:
            doc_blocks = lark_doc.get_document_blocks(LARK_DOC_TOKEN)
            full_okr_text = parse_okr_doc(doc_blocks)
            print(f"Loaded OKR context ({len(full_okr_text)} chars)")
        except Exception as doc_error:
            error_msg = f"Could not fetch real OKRs from Wiki: {doc_error}"
            print(f"Warning: {error_msg}")
            results["status"] = "partial_error"
            results["errors"].append(error_msg)
            return results

        # 2. Fetch Value Metrics from Base
        print("Fetching Value Metrics from Base...")
        records = lark_base.get_base_records(LARK_BASE_TOKEN, LARK_TABLE_ID)
        print(f"Loaded {len(records)} records.")
        
        # 3. Process and Score
        for record in records:
            record_id = record.get("record_id")
            fields = record.get("fields", {})
            
            # Extract fields correctly
            vm_pic = extract_text(fields.get("VM PIC"))
            vm_bu = extract_text(fields.get("PIC BU"))
            metric_name = extract_text(fields.get("Metric Name"))
            description = extract_text(fields.get("Description"))
            austina_score = fields.get("Austina Score")
            
            # Skip if score is already there (handling both None and existence check)
            # We use the score field directly because 'Status' is a formula column and unreliable for filtering.
            # We re-process if the score is '0' or empty to resolve previous sync errors.
            if vm_pic and metric_name and (austina_score is None or austina_score == "" or str(austina_score) == "0"):
                print(f"\n--- Analyzing record {record_id} ---")
                print(f"PIC: {vm_pic}, Metric: {metric_name}")
                
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
                
                print(f"-> Result: {score}/100")
                
                # 4. Update Base
                update_fields = {
                    "Austina Score": int(score),
                    "AI Suggestion": suggestion
                }
                
                success = lark_base.update_base_record(LARK_BASE_TOKEN, LARK_TABLE_ID, record_id, update_fields)
                if success:
                    print(f"Successfully updated record {record_id}")
                    results["processed"] += 1
                else:
                    print(f"Failed to update record {record_id}")
                    results["errors"].append(f"Failed to update {record_id}")
                
                # Sleep briefly to avoid API rate limits
                time.sleep(1)
        
        print(f"\nProcessing complete. Analyzed {results['processed']} new records.")
    except Exception as e:
        results["status"] = "error"
        results["errors"].append(str(e))
        print(f"Fatal Error: {e}")
    
    return results

if __name__ == "__main__":
    run_analyzer()
