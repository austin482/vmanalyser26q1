// Lark Bitable API Service - Read/Write VM data from Lark Base
// Handles authentication, fetching VMs, and updating analysis results

const LARK_APP_ID = 'cli_a9eed0d5dcb89ed3';
const LARK_APP_SECRET = 'uwdb9LnnZbG66aPsP1hvReSGzNOzBZoZ';
const BASE_ID = 'FUBhb3uUaa0h21suULgluANog8f';
const TABLE_ID = 'tblz3uSEbkQGVXRq';

const LARK_API_BASE = 'https://open.larksuite.com/open-apis';

/**
 * Universal retry helper for Lark API calls
 */
async function withRetry(fn, maxRetries = 3, delay = 2000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            // Retry on "Data not ready" or network errors
            if (error.message.includes('Data not ready') || error.message.includes('fetch')) {
                console.warn(`⚠️ Lark API busy (Retry ${i + 1}/${maxRetries}): ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); // Exponential backoff
                continue;
            }
            throw error; // Immediate fail for other errors
        }
    }
    throw lastError;
}

/**
 * Get tenant access token for Lark API
 */
export async function getTenantAccessToken() {
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

        console.log('✅ Lark authentication successful');
        return data.tenant_access_token;
    } catch (error) {
        console.error('❌ Lark authentication failed:', error);
        throw error;
    }
}

/**
 * Fetch all records from a specific Lark Bitable table
 * @param {string} tableId - The table ID to fetch from
 * @param {string} filter - Optional filter condition
 */
export async function fetchRecordsFromTable(tableId, filter = null) {
    return withRetry(async () => {
        const token = await getTenantAccessToken();

        let url = `${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${tableId}/records`;

        // Add filter if provided
        if (filter) {
            url += `?filter=${encodeURIComponent(filter)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`Failed to fetch records from ${tableId}: ${data.msg}`);
        }

        const items = data.data?.items || [];
        console.log(`✅ Fetched ${items.length} records from table ${tableId}`);
        return items;
    });
}

/**
 * Fetch all records from the default VM table
 * @param {string} filter - Optional filter condition (e.g., 'CurrentValue.[Status]="Pending"')
 */
export async function fetchVMsFromLark(filter = null) {
    return await fetchRecordsFromTable(TABLE_ID, filter);
}

/**
 * Fetch pending VMs (Status = "Pending")
 */
export async function fetchPendingVMs() {
    // Lark filter syntax: CurrentValue.[FieldName]="Value"
    const filter = 'CurrentValue.[Status]="Pending"';
    return await fetchVMsFromLark(filter);
}

/**
 * Update a single VM record in Lark
 * @param {string} recordId - The record ID to update
 * @param {Object} fields - Fields to update (e.g., { "Austina Score": 85, "AI Suggestion": "..." })
 */
export async function updateVMInLark(recordId, fields) {
    return withRetry(async () => {
        const token = await getTenantAccessToken();

        const response = await fetch(
            `${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${TABLE_ID}/records/${recordId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: fields
                })
            }
        );

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`Failed to update record: ${data.msg}`);
        }

        console.log(`✅ Updated record ${recordId}`);
        return data.data;
    });
}

/**
 * Batch update multiple VM records
 * @param {Array} updates - Array of {recordId, fields} objects
 */
export async function batchUpdateVMs(updates) {
    const results = [];
    const errors = [];

    for (const update of updates) {
        try {
            const result = await updateVMInLark(update.recordId, update.fields);
            results.push({ recordId: update.recordId, success: true, result });
        } catch (error) {
            errors.push({ recordId: update.recordId, error: error.message });
        }
    }

    return { results, errors };
}

/**
 * Get table schema to understand field names and types
 */
export async function getTableSchema() {
    return withRetry(async () => {
        const token = await getTenantAccessToken();

        const response = await fetch(
            `${LARK_API_BASE}/bitable/v1/apps/${BASE_ID}/tables/${TABLE_ID}/fields`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`Failed to fetch schema: ${data.msg}`);
        }

        console.log('✅ Table schema fetched');
        return data.data.items;
    });
}
/**
 * Get BU field options mapping (ID -> Name)
 */
export async function getBUFieldMapping() {
    try {
        const schema = await getTableSchema();
        const buField = schema.find(f => f.field_name === 'PIC BU');

        console.log('🔍 BU Field found:', buField ? 'YES' : 'NO');
        if (buField) {
            console.log('🔍 BU Field structure:', JSON.stringify(buField, null, 2));
        }

        if (!buField || !buField.property || !buField.property.options) {
            console.warn('⚠️ PIC BU field options not found in schema');
            return {};
        }

        const mapping = Object.fromEntries(
            buField.property.options.map(opt => [opt.id, opt.name])
        );

        console.log(`✅ BU field mapping loaded: ${Object.keys(mapping).length} options`);
        return mapping;

    } catch (error) {
        console.error('❌ Error fetching BU field mapping:', error);
        return {};
    }
}
