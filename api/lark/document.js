// Vercel Serverless Function: GET /api/lark/document/[id]
// Fetches the raw content of a Lark Document (Wiki or Docx)

const LARK_API_BASE = 'https://open.larksuite.com/open-apis';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ code: 405, msg: 'Method Not Allowed' });
    }

    try {
        const { id, token } = req.query;

        if (!id) {
            return res.status(400).json({ code: 400, msg: 'Document ID is required' });
        }

        if (!token) {
            return res.status(401).json({ code: 401, msg: 'Tenant access token is required' });
        }

        console.log(`Fetching content for document ID: ${id}`);

        let content = '';

        // First, try fetching it as a Docx
        const docxResponse = await fetch(`${LARK_API_BASE}/docx/v1/documents/${id}/raw_content`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (docxResponse.ok) {
            const data = await docxResponse.json();
            if (data.code === 0 && data.data) {
                content = data.data.content;
            }
        }

        // If not found or failed, try fetching as a Wiki Node
        if (!content) {
            const wikiResponse = await fetch(`${LARK_API_BASE}/wiki/v2/spaces/get_node?token=${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (wikiResponse.ok) {
                const wikiData = await wikiResponse.json();
                if (wikiData.code === 0 && wikiData.data && wikiData.data.node) {
                    const realDocId = wikiData.data.node.obj_token;

                    // Fetch the actual content using the real doc ID
                    const realDocResponse = await fetch(`${LARK_API_BASE}/docx/v1/documents/${realDocId}/raw_content`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (realDocResponse.ok) {
                        const realData = await realDocResponse.json();
                        if (realData.code === 0 && realData.data) {
                            content = realData.data.content;
                        }
                    }
                }
            }
        }

        if (content) {
            return res.status(200).json({ code: 0, msg: 'success', data: { content } });
        } else {
            return res.status(404).json({ code: 404, msg: 'Document not found or access denied' });
        }

    } catch (error) {
        console.error('Lark Document API Error:', error);
        return res.status(500).json({ code: 500, msg: error.message });
    }
}
