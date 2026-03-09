// Vercel Serverless Function: POST /api/lark/webhook
// Called by Lark automation button — triggers the sync-vms flow

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔔 Webhook triggered from Lark automation');

        // Call our own sync endpoint (absolute URL using Vercel host header)
        const host = req.headers.host || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const syncUrl = `${protocol}://${host}/api/lark/sync-vms`;

        const syncResponse = await fetch(syncUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const syncData = await syncResponse.json();

        return res.json({
            success: true,
            message: `Synced ${syncData.analyzed || 0} VMs`,
            data: syncData
        });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
