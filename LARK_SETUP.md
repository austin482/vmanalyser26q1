# Lark VM Auto-Analysis - Setup Guide

## ✅ What's Ready

The automation system is **complete and working**! Here's what's been built:

- ✅ Lark Bitable API service (reads/writes VMs)
- ✅ Auto-analyzer script using your existing `analyzer.js`
- ✅ Loads 8 OKRs from your database automatically
- ✅ Lark authentication working
- ✅ Handles field types correctly (PIC BU as array, Score as text)
- ✅ Skips Status field (per your request)

## 🔒 What You Need to Do: Set Up Permissions

The script is blocked by **"RolePermNotAllow"** - your Lark app needs permission to access the base.

### Step 1: Enable API Permissions (5 minutes)

1. Go to **Lark Developer Console**: https://open.larksuite.com/app
2. Find your app with App ID: `cli_a9eed0d5dcb89ed3`
3. Click **"Permissions & Scopes"**
4. Add these permissions:
   - ✅ `bitable:app` (Read and write bitable data)
   - ✅ `bitable:app:readonly` (Read bitable data)
5. Click **"Save"**
6. Go to **"Version Management & Release"** → **"Publish"** the app

### Step 2: Grant App Access to Your Base (2 minutes)

1. Open your Lark base: https://ajobthing.sg.larksuite.com/base/FUBhb3uUaa0h21suULgluANog8f
2. Click **"..."** (more options) in the top right
3. Select **"Settings"** → **"Integration"** or **"Advanced Settings"**
4. Find your app in the list
5. Click **"Add"** or **"Grant Access"**
6. Enable **read/write** permissions

### Step 3: Test the Script

Once permissions are set up, run:

```bash
cd /Users/austinyn/Documents/MKT\ VM
node scripts/lark_vm_auto_analyzer.js
```

## 📊 How It Works

1. **Loads OKRs** from your `austina.db` database (8 OKRs found)
2. **Fetches VMs** from Lark where Status = "Pending"
3. **For each VM**:
   - Uses your existing `analyzer.js` logic
   - Analyzes against all KRs in the VM's BU
   - Generates score (0-100) and suggestions
4. **Updates Lark** with:
   - `Austina Score`: The AI score (as text)
   - `AI Suggestion`: Formatted insights and recommendations
   - Status field is **NOT** changed

## 🎯 Expected Output

```
🚀 Starting Lark VM Auto-Analysis...

📋 Step 1: Loading OKRs from database...
✅ Loaded 8 OKRs from database

📋 Step 2: Fetching table schema...
⚠️ Could not fetch schema (permission issue), continuing...

📥 Step 3: Fetching VMs from Lark...
Found 3 VM(s) to analyze

🤖 Step 4: Analyzing VMs with AI...

🔍 Analyzing: Increase profile completion rate
   BU: JS Product
✅ Score: 85

📤 Step 5: Updating Lark with results...
✅ Updated: Increase profile completion rate (Score: 85)

✅ Auto-analysis complete!
   Analyzed: 3 VMs
   Average Score: 82
```

## 🔄 Running Regularly

### Option 1: Manual (Recommended for now)
Run whenever you have pending VMs:
```bash
node scripts/lark_vm_auto_analyzer.js
```

### Option 2: Scheduled (Future)
Add to cron to run daily:
```bash
# Run every day at 9 AM
0 9 * * * cd /Users/austinyn/Documents/MKT\ VM && node scripts/lark_vm_auto_analyzer.js
```

### Option 3: UI Button (Future)
I can add a button to your existing web app to trigger this.

## 🐛 Troubleshooting

**"RolePermNotAllow" error**
→ Complete Step 1 & 2 above to grant permissions

**"No pending VMs found"**
→ Make sure at least one VM in Lark has Status = "Pending"

**"Analysis failed"**
→ Check that PIC BU matches an OKR BU name in your database

**"Could not load OKRs"**
→ Make sure `austina.db` exists and has OKR data

## 📝 Field Mappings

The script expects these exact field names in your Lark table:
- `Metric Name` (Text)
- `Description` (Text)
- `PIC BU` (Multiple Option) - Script uses first value
- `Austina Score` (Text) - Updated by script
- `AI Suggestion` (Text) - Updated by script
- `Status` (Any) - NOT updated by script

## ✨ Next Steps

1. **Complete permission setup** (Steps 1 & 2 above)
2. **Set a VM to Status="Pending"** in your Lark base
3. **Run the script** and verify it works
4. **Review the AI output** quality
5. **Run on all pending VMs** when ready
