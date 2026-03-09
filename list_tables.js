const LARK_APP_ID = 'cli_a9eed0d5dcb89ed3';
const LARK_APP_SECRET = 'uwdb9LnnZbG66aPsP1hvReSGzNOzBZoZ';
const BASE_ID = 'FUBhb3uUaa0h21suULgluANog8f';
const LARK_API_BASE = 'https://open.larksuite.com/open-apis';

async function getTenantAccessToken() {
    try {
        const response = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                app_id: LARK_APP_ID,
                app_secret: LARK_APP_SECRET
            })
        });

        const data = await response.json();
        if (data.code !== 0) {
            throw new Error(`Lark auth error: ${data.msg}`);
        }
        return data.tenant_access_token;
    } catch (error) {
        console.error('❌ Lark authentication failed:', error);
        throw error;
    }
}

async function listTables() {
    try {
        const token = await getTenantAccessToken();
        const response = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.code !== 0) {
            throw new Error(`Failed to fetch tables: ${data.msg}`);
        }

        console.log('Tables in Base:');
        data.data.items.forEach(table => {
            console.log(`- ${table.name} (ID: ${table.table_id})`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

listTables();
