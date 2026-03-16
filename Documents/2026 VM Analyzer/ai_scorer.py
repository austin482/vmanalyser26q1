import urllib.request
import json
import ssl
from typing import Dict, Any
from config import OPENROUTER_API_KEY, OPENROUTER_MODEL

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

class AIScorer:
    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        self.model = OPENROUTER_MODEL
        self.url = "https://openrouter.ai/api/v1/chat/completions"

    def generate_prompt(self, doc_objective: str, doc_key_result: str, doc_pic: str, doc_bu: str, 
                        vm_pic: str, vm_bu: str, vm_metric_name: str, vm_description: str) -> str:
        prompt = f"""
You are an expert OKR Alignment Analyzer. 
Your job is to evaluate whether a Product Manager's (PIC's) submitted "Value Metric" aligns with their assigned Key Result (KR) and Objective (Obj) for the quarter. 

You must strictly evaluate the alignment and provide:
1. A Score out of 100 (where 100 is perfect alignment, 1 is no alignment).
2. A Suggestion/Justification for the score. 

If the submitted Value Metric does NOT align with the OKR at all, or belongs to a completely different OKR, you MUST output "❌ Reject" at the beginning of your Suggestion.

### OKR Context (From Lark Doc)
- Objective: {doc_objective}
- Key Result: {doc_key_result}
- PIC: {doc_pic}
- BU Name: {doc_bu}

### Value Metric Submission (From Lark Base)
- VM PIC: {vm_pic}
- PIC BU (Business Unit): {vm_bu}
- Metric Name: {vm_metric_name}
- Description: {vm_description}

Analyze the submitted Value Metric against the OKR Context.

Step 1: Verify Ownership
Does the "VM PIC" match or collaborate on the "PIC" listed in the OKR Context? 

Step 2: Evaluate Alignment
Does the "Metric Name" and "Description" actually drive progress toward the "Key Result"? 
- Does it measure what matters for this KR?
- Is it a vanity metric or an actionable Value Metric?

Step 3: Scoring & Output
Calculate a score from 1 to 100 based on the alignment and quality of the metric.
- 90-100: Perfect alignment. The metric directly measures the Key Result.
- 70-89: Good alignment. The metric is relevant but could be more direct or better defined.
- 40-69: Weak alignment. The metric relates to the Objective but doesn't clearly drive the specific Key Result.
- 0: Poor/No alignment.

CRITICAL REJECTION RULE:
If the submitted Value Metric does NOT align with the OKR, or belongs to a different OKR/BU:
1. You MUST set the "score" to exactly 0.
2. You MUST set the "suggestion" to exactly "❌ Reject" (no other text).

Otherwise, output exactly a JSON object in this format:
{{
  "score": <integer from 1 to 100>,
  "suggestion": "📊 Insights:\n• <Point 1>\n• <Point 2>\n\n💡 Suggestions:\n• <Point 1>\n• <Point 2>"
}}
"""
        return prompt

    def score_alignment(self, doc_objective: str, doc_key_result: str, doc_pic: str, doc_bu: str, 
                        vm_pic: str, vm_bu: str, vm_metric_name: str, vm_description: str) -> Dict[str, Any]:
        """Calls OpenRouter with the dynamic prompt and parses the JSON response."""
        
        system_msg = "You are a specialized AI designed to output only valid JSON."
        user_msg = self.generate_prompt(
            doc_objective, doc_key_result, doc_pic, doc_bu,
            vm_pic, vm_bu, vm_metric_name, vm_description
        )
        
        payload = json.dumps({
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 500
        }).encode("utf-8")

        req = urllib.request.Request(
            self.url,
            data=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ajobthing.com", # Required by openrouter
            }
        )

        try:
            resp = urllib.request.urlopen(req, context=ctx)
            resp_body = resp.read().decode()
            resp_data = json.loads(resp_body)
            
            content = resp_data.get("choices", [])[0].get("message", {}).get("content", "{}")
            
            # Parse the JSON string from the AI content response
            result = json.loads(content)
            return result
            
        except Exception as e:
            error_msg = str(e)
            if hasattr(e, "read"):
                try:
                    error_body = e.read().decode()
                    error_data = json.loads(error_body)
                    error_msg = error_data.get("error", {}).get("message", error_body)
                except:
                    error_msg = str(e)
            
            print(f"OpenRouter Error: {error_msg}")
            
            # Return safe fallback with the actual error message
            return {
                "score": 0,
                "suggestion": f"📊 Insights:\n• Analysis failed: {error_msg}\n\n💡 Suggestions:\n• Check your OpenRouter API Key in config.py or Vercel environment variables."
            }
