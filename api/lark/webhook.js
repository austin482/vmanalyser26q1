// Vercel Serverless Function: POST /api/lark/webhook
// Called by Lark automation button — triggers the sync-vms flow

const BASE_URL = 'https://vmanalyser2026.vercel.app';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ code: 405, msg: 'Method not allowed' });
    }

    console.log('🔔 Webhook triggered from Lark automation');

    // FIX 1 & 2: Respond to Lark immediately with the correct format
    // Lark requires { code: 0 } and times out if we wait too long
    res.status(200).json({ code: 0, msg: 'Sync triggered' });

    // FIX 3: Fire sync in background using correct hardcoded URL
    fetch(`${BASE_URL}/api/lark/sync-vms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.error('❌ Sync trigger failed:', err.message));
}
