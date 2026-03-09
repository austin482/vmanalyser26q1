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
        throw error;
    }
}

async function inspectTable(tableId, tableName) {
    try {
        const token = await getTenantAccessToken();
        const schemaResponse = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${tableId}/fields`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const schema = await schemaResponse.json();
        console.log(`\n--- Fields for ${tableName} (${tableId}) ---`);
        console.log(schema.data.items.map(f => f.field_name));

        const dataResponse = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${tableId}/records?page_size=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const records = await dataResponse.json();
        if (records.data.items && records.data.items.length > 0) {
            console.log('Sample Record:', JSON.stringify(records.data.items[0].fields, null, 2));
        } else {
            console.log('No records found.');
        }
    } catch (error) {
        console.error(`Error inspecting ${tableName}:`, error);
    }
}

async function run() {
    await inspectTable('tblF8NIVgonEXXRC', 'Q1 Overall BUKR Rank');
    await inspectTable('tblzHjByjzN5GJhe', 'Q1 VM Result (Per Weekly)');
}

run();
