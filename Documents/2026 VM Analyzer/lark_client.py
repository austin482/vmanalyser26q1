import urllib.request
import json
import ssl
from typing import Dict, List, Any

# Disable SSL verification for simplicity if needed (as per previous tests)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

class LarkClient:
    def __init__(self, app_id: str, app_secret: str):
        self.app_id = app_id
        self.app_secret = app_secret
        self.tenant_access_token = None
        
    def authenticate(self) -> str:
        url = "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal"
        payload = json.dumps({
            "app_id": self.app_id,
            "app_secret": self.app_secret
        }).encode("utf-8")
        
        req = urllib.request.Request(
            url, 
            data=payload, 
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
        
        try:
            resp = urllib.request.urlopen(req, context=ctx)
            data = json.loads(resp.read().decode())
            if data.get("code") == 0:
                self.tenant_access_token = data.get("tenant_access_token")
                return self.tenant_access_token
            else:
                raise Exception(f"Failed to authenticate: {data.get('msg')}")
        except Exception as e:
            print(f"Auth Error: {e}")
            raise
            
    def get_headers(self) -> Dict[str, str]:
        if not self.tenant_access_token:
            self.authenticate()
        return {
            "Authorization": f"Bearer {self.tenant_access_token}",
            "Content-Type": "application/json"
        }

    def get_document_blocks(self, document_token: str) -> List[Dict]:
        """First gets the actual object token from the wiki node, then fetches blocks."""
        # Get Node Info
        wiki_url = f"https://open.larksuite.com/open-apis/wiki/v2/spaces/get_node?token={document_token}"
        req = urllib.request.Request(wiki_url, headers=self.get_headers())
        
        try:
            resp = urllib.request.urlopen(req, context=ctx)
            data = json.loads(resp.read().decode())
            obj_token = data.get("data", {}).get("node", {}).get("obj_token")
            
            if not obj_token:
                raise Exception("Could not find obj_token for this wiki node.")
                
            # Now fetch the docx blocks
            doc_url = f"https://open.larksuite.com/open-apis/docx/v1/documents/{obj_token}/blocks"
            doc_req = urllib.request.Request(doc_url, headers=self.get_headers())
            doc_resp = urllib.request.urlopen(doc_req, context=ctx)
            doc_data = json.loads(doc_resp.read().decode())
            
            return doc_data.get("data", {}).get("items", [])
            
        except Exception as e:
            if hasattr(e, "read"):
                error_body = e.read().decode()
                print(f"Error fetching document blocks: {error_body}")
            else:
                print(f"Error fetching document blocks: {e}")
            raise

    def get_base_records(self, base_token: str, table_id: str) -> List[Dict]:
        """Fetches all records from a specified Base table."""
        records = []
        page_token = ""
        has_more = True
        
        while has_more:
            url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{base_token}/tables/{table_id}/records"
            if page_token:
                url += f"?page_token={page_token}"
                
            req = urllib.request.Request(url, headers=self.get_headers())
            
            try:
                resp = urllib.request.urlopen(req, context=ctx)
                data = json.loads(resp.read().decode())
                
                resp_data = data.get("data", {})
                records.extend(resp_data.get("items", []))
                
                has_more = resp_data.get("has_more", False)
                page_token = resp_data.get("page_token", "")
                
            except Exception as e:
                if hasattr(e, "read"):
                    error_body = e.read().decode()
                    print(f"Error fetching base records: {error_body}")
                else:
                    print(f"Error fetching base records: {e}")
                raise
                
        return records

    def update_base_record(self, base_token: str, table_id: str, record_id: str, fields: Dict[str, Any]) -> bool:
        """Updates specific fields of a single record in the Base."""
        url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{base_token}/tables/{table_id}/records/{record_id}"
        
        payload = json.dumps({
            "fields": fields
        }).encode("utf-8")
        
        req = urllib.request.Request(url, data=payload, headers=self.get_headers(), method="PUT")
        
        try:
            resp = urllib.request.urlopen(req, context=ctx)
            data = json.loads(resp.read().decode())
            return data.get("code") == 0
        except Exception as e:
            if hasattr(e, "read"):
                error_body = e.read().decode()
                print(f"Error updating base record {record_id}: {error_body}")
            else:
                print(f"Error updating base record {record_id}: {e}")
            return False
