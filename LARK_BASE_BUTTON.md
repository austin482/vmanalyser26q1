# Add Sync Button to Your Lark Base

## 🎯 Overview

Add a button directly in your Lark base that triggers VM auto-analysis with one click.

## 📋 Setup Instructions

### Step 1: Add Button Field to Your Table

1. **Open your Lark base**: https://ajobthing.sg.larksuite.com/base/FUBhb3uUaa0h21suULgluANog8f
2. Click **"+"** to add a new field
3. Select **"Button"** field type
4. Name it: **"Analyze VM"** or **"Sync Score"**
5. Click **"Configure Button"**

### Step 2: Configure Button Action

In the button configuration:

1. **Action Type**: Select **"Open URL"**
2. **URL**: Enter this (replace `YOUR_SERVER_IP` if not localhost):
   ```
   http://localhost:3001/api/lark/sync-single?record_id={record_id}
   ```
3. **Open in**: Select **"Current window"** or **"New tab"**
4. Click **"Save"**

### Step 3: Add Backend Endpoint (Already Done!)

The server endpoint is ready at: `http://localhost:3001/api/lark/sync-vms`

For single-record sync, I'll add: `http://localhost:3001/api/lark/sync-single`

---

## 🚀 Alternative: Batch Sync Button

If you want ONE button to sync ALL pending VMs:

### Option A: Use Lark Automation

1. Go to your base → **"Automations"**
2. Create new automation
3. **Trigger**: Manual button click
4. **Action**: HTTP Request
   - URL: `http://localhost:3001/api/lark/sync-vms`
   - Method: POST
   - Headers: `Content-Type: application/json`

### Option B: Use External Tool (Simpler)

Create a simple HTML file you can bookmark:

**File: `lark_sync_trigger.html`**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Lark VM Sync</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover {
            transform: scale(1.05);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        #result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            display: none;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Lark VM Sync</h1>
        <p>Click to analyze all pending VMs in your Lark base</p>
        <button onclick="syncVMs()" id="syncBtn">Start Sync</button>
        <div id="result"></div>
    </div>

    <script>
        async function syncVMs() {
            const btn = document.getElementById('syncBtn');
            const result = document.getElementById('result');
            
            btn.disabled = true;
            btn.textContent = 'Syncing...';
            result.style.display = 'none';
            
            try {
                const response = await fetch('http://localhost:3001/api/lark/sync-vms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.className = 'success';
                    result.innerHTML = `
                        <strong>✅ Sync Complete!</strong><br>
                        Analyzed: ${data.analyzed} VMs<br>
                        Average Score: ${data.averageScore}<br>
                        ${data.failed > 0 ? `Failed: ${data.failed}` : ''}
                    `;
                } else {
                    throw new Error(data.error || 'Sync failed');
                }
            } catch (error) {
                result.className = 'error';
                result.innerHTML = `
                    <strong>❌ Sync Failed</strong><br>
                    ${error.message}<br><br>
                    <small>Make sure:<br>
                    1. Server is running (npm run server)<br>
                    2. Lark permissions are set up<br>
                    3. At least one VM has Status="Pending"</small>
                `;
            } finally {
                btn.disabled = false;
                btn.textContent = 'Start Sync';
                result.style.display = 'block';
            }
        }
    </script>
</body>
</html>
```

**Usage:**
1. Save this file to `/Users/austinyn/Documents/MKT VM/lark_sync_trigger.html`
2. Open it in your browser
3. Bookmark it for quick access
4. Click "Start Sync" whenever you want to analyze pending VMs

---

## 🔧 For Single-Record Button (Per Row)

If you want a button on each row to analyze just that VM, I need to add a new endpoint. Let me know and I'll create:

- Endpoint: `/api/lark/sync-single?record_id={record_id}`
- Analyzes only the specific VM row
- Updates just that row's score and suggestions

---

## ✅ Recommended Approach

**For your use case, I recommend Option B (HTML file)** because:
- ✅ Simple one-click operation
- ✅ Shows real-time progress and results
- ✅ Works from anywhere (just bookmark it)
- ✅ No need to configure Lark button widgets
- ✅ Visual feedback on success/failure

**Next Steps:**
1. I'll create the HTML file for you
2. You open it and bookmark it
3. Click whenever you want to sync VMs from Lark

Sound good?
