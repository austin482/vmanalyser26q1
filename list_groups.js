const LARK_APP_ID = 'cli_a9eed0d5dcb89ed3';
const LARK_APP_SECRET = 'uwdb9LnnZbG66aPsP1hvReSGzNOzBZoZ';
const LARK_API_BASE = 'https://open.larksuite.com/open-apis';

async function getTenantAccessToken() {
    try {
        const response = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET })
        });
        const data = await response.json();
        return data.tenant_access_token;
    } catch (error) {
        throw error;
    }
}

async function listGroups() {
    try {
        const token = await getTenantAccessToken();
        const url = `${LARK_API_BASE}/im/v1/chats`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.code !== 0) {
            console.error('API Error:', data);
            return;
        }

        console.log('Groups (Chats) the bot is in:');
        data.data.items.forEach(chat => {
            console.log(`- ${chat.name} (ID: ${chat.chat_id})`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

listGroups();
