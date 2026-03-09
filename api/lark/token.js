// Vercel Serverless Function: POST /api/lark/token
// Returns a Lark tenant access token (keeps credentials server-side)

const LARK_APP_ID = process.env.VITE_LARK_APP_ID || 'cli_a9d1efc6a2381ed4';
const LARK_APP_SECRET = process.env.VITE_LARK_APP_SECRET || 'wWL8cXBdwk2895DpQFNzBgSgrkT1kujN';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET })
        });

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error('Lark token error:', error);
        return res.status(500).json({ error: 'Failed to get Lark token' });
    }
}
