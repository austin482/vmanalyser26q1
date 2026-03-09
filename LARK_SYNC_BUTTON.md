# How to Use the Lark Sync Button

## ✨ What It Does

The **"Sync Lark"** button in your app automatically:
1. Fetches all VMs with Status="Pending" from your Lark base
2. Analyzes each VM using your existing AI analyzer
3. Updates `Austina Score` and `AI Suggestion` fields in Lark
4. Shows you a summary of results

## 🎯 Quick Start

### 1. Set Up Lark Permissions (One-Time)

Follow the steps in `LARK_SETUP.md` to grant your Lark app permission to access the base.

### 2. Prepare VMs in Lark

In your Lark base, set the Status of VMs you want analyzed to **"Pending"**

### 3. Click the Sync Button

1. Open your app: http://localhost:5173
2. Click the **"Sync Lark"** button in the top navigation (purple button)
3. Click **"Start Sync"** in the modal
4. Wait for the analysis to complete (shows progress)
5. Check the results summary

### 4. Verify in Lark

Refresh your Lark base and check that:
- `Austina Score` is filled in (0-100)
- `AI Suggestion` has insights and recommendations

## 📊 What You'll See

**During Sync:**
- Spinning animation
- "Syncing..." message

**After Sync:**
- ✅ Success message with:
  - Number of VMs analyzed
  - Average score
  - Number of failures (if any)

**In Server Console:**
- Real-time progress logs
- Each VM being analyzed
- Scores and updates

## 🔄 Alternative: Command Line

You can still run the script directly if you prefer:

```bash
cd /Users/austinyn/Documents/MKT\ VM
node scripts/lark_vm_auto_analyzer.js
```

## 🐛 Troubleshooting

**Button doesn't work:**
- Make sure server is running: `npm run server`
- Check browser console for errors

**"No pending VMs found":**
- Set at least one VM's Status to "Pending" in Lark

**"Permission denied" error:**
- Complete the Lark permission setup (see `LARK_SETUP.md`)

**Analysis fails:**
- Check that PIC BU matches an OKR BU name in your database
- Verify field names are correct in Lark

## 💡 Tips

- **Test with one VM first** before syncing many
- **Server must be running** for the button to work
- **Refresh Lark** after sync to see updated values
- **Check server console** for detailed logs
