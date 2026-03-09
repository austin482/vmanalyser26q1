// Lark API Service - Fetch and parse Lark Documents
// Credentials stored in .env.local

const LARK_APP_ID = import.meta.env.VITE_LARK_APP_ID;
const LARK_APP_SECRET = import.meta.env.VITE_LARK_APP_SECRET;

/**
 * Get tenant access token from Lark API via backend proxy
 */
async function getTenantAccessToken() {
    try {
        const response = await fetch('/api/lark/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`Lark API error: ${data.msg}`);
        }

        return data.tenant_access_token;
    } catch (error) {
        console.error('Lark API error:', error);
        throw error;
    }
}

/**
 * Extract document ID from Lark URL
 * Supports: https://xxx.larksuite.com/wiki/xxxxx or https://xxx.larksuite.com/docx/xxxxx
 */
function extractDocumentId(url) {
    const match = url.match(/\/(?:wiki|docx)\/([a-zA-Z0-9]+)/);
    if (!match) {
        throw new Error('Invalid Lark document URL');
    }
    return match[1];
}

/**
 * Fetch Lark document content via backend proxy
 */
export async function fetchLarkDocument(url) {
    try {
        console.log('🔄 Fetching Lark document...');

        const token = await getTenantAccessToken();
        const docId = extractDocumentId(url);

        // Fetch document via Vercel serverless proxy
        const response = await fetch(`/api/lark/document?id=${docId}&token=${token}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(`Failed to fetch document: ${data.msg}`);
        }

        console.log('✅ Document fetched successfully');
        return data.data.content;

    } catch (error) {
        console.error('❌ Lark API error:', error);
        throw error;
    }
}

/**
 * Parse Lark document content to extract VM data
 * Expected format:
 * Metric Name: ...
 * Description: ...
 * Business Unit: ... (Required)
 * Related OKR: ... (Optional)
 * OKR Rationale: ... (Optional)
 */
export function parseLarkDocumentToVM(content) {
    const vmData = {
        metricName: '',
        description: '',
        selectedBU: '',      // Required
        selectedOKR: '',     // Optional
        okrRationale: ''
    };

    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        const match = trimmed.match(/^([^:：]+)[：:]\s*(.+)$/);

        if (match) {
            const key = match[1].trim().toLowerCase();
            const value = match[2].trim();

            if (key.includes('metric') && key.includes('name')) {
                vmData.metricName = value;
            } else if (key.includes('description') || key.includes('desc')) {
                vmData.description = value;
            } else if (key.includes('business') && key.includes('unit') || key.includes('bu')) {
                vmData.selectedBU = value;
            } else if (key.includes('okr') && (key.includes('related') || key.includes('link'))) {
                vmData.selectedOKR = value;
            } else if (key.includes('rationale') || key.includes('reason') || key.includes('why')) {
                vmData.okrRationale = value;
            }
        }
    }

    return vmData;
}

/**
 * Import VM from Lark document URL
 */
export async function importVMFromLark(url) {
    const content = await fetchLarkDocument(url);
    const vmData = parseLarkDocumentToVM(content);

    // Validate required fields
    if (!vmData.metricName) {
        throw new Error('Could not find "Metric Name" in document');
    }

    if (!vmData.selectedBU) {
        throw new Error('Could not find "Business Unit" in document. Please add "Business Unit: <BU Name>" to your Lark document.');
    }

    return vmData;
}

/**
 * Parse Lark document content to extract multiple OKRs (one per BU)
 * Returns an array of OKR objects
 */
export function parseLarkDocumentToOKR(content) {
    console.log('📄 Raw document content:', content);
    console.log('📄 Content length:', content.length);

    const lines = content.split('\n');
    console.log('📄 Total lines:', lines.length);

    const okrs = []; // Array to hold multiple OKRs
    let currentOKR = null;
    let currentKR = null;
    let globalQuarter = ''; // Quarter that applies to all BUs

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) continue;

        console.log(`Line ${i}:`, line);

        // Extract global quarter (applies to all BUs if found before first BU)
        const quarterMatch = line.match(/Q[1-4]\s*\d{4}|\d{4}\s*Q[1-4]/i);
        if (quarterMatch && !currentOKR) {
            globalQuarter = quarterMatch[0];
            console.log('✅ Found global quarter:', globalQuarter);
            continue;
        }

        // Detect BU boundary - this starts a new OKR
        const buMatch = line.match(/(?:BU\s*Name|Business\s*Unit)\s*[：:]\s*(.+)/i);
        if (buMatch) {
            // Save previous OKR if exists
            if (currentOKR && currentOKR.buName) {
                okrs.push(currentOKR);
                console.log('💾 Saved OKR for BU:', currentOKR.buName);
            }

            // Start new OKR
            currentOKR = {
                quarter: globalQuarter,
                buName: buMatch[1].trim(),
                objective: '',
                keyResults: []
            };
            currentKR = null; // Reset current KR
            console.log('✅ Found new BU:', currentOKR.buName);
            continue;
        }

        // If we don't have a current OKR yet, create a default one
        if (!currentOKR) {
            currentOKR = {
                quarter: globalQuarter,
                buName: '',
                objective: '',
                keyResults: []
            };
        }

        // Extract quarter for current OKR (overrides global)
        if (quarterMatch && currentOKR && !currentOKR.quarter) {
            currentOKR.quarter = quarterMatch[0];
            console.log('✅ Found quarter for current BU:', currentOKR.quarter);
        }

        // Extract Objective
        const objMatch = line.match(/(?:Objective|OKR)\s*[：:]\s*(.+)/i);
        if (objMatch && currentOKR) {
            currentOKR.objective = objMatch[1].trim();
            console.log('✅ Found objective:', currentOKR.objective);
            continue;
        }

        // Extract Key Results - match "KR X.X" or "KR X" with or without colon
        const krMatch = line.match(/^KR\s*(\d+\.?\d*)\s*[：:]?\s*(.*)$/i);
        if (krMatch && currentOKR) {
            const krNumber = krMatch[1];
            const krDescription = krMatch[2] || '';

            currentKR = {
                id: `kr${currentOKR.keyResults.length + 1}`,
                category: krDescription.trim() || `Key Result ${krNumber}`,
                metrics: [],
                ratio: '50%',
                pic: '',
                target: '',
                projection: ''
            };
            currentOKR.keyResults.push(currentKR);
            console.log('✅ Found KR:', currentKR.category, '(KR', krNumber + ')');
            continue;
        }

        // Extract metrics (lines starting with -, •, or *)
        if (currentKR && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))) {
            const metric = line.replace(/^[-•*]\s*/, '').trim();
            if (metric) {
                currentKR.metrics.push(metric);
                console.log('✅ Found metric:', metric);
            }
            continue;
        }

        // Auto-detect metrics or update KR category
        if (currentKR && line && !line.match(/^(?:KR|Obj|PIC|No|\d+\.?\d*$)/i)) {
            if (line.length > 10) {
                // Update KR category if it's still generic
                if (currentKR.category.startsWith('Key Result')) {
                    currentKR.category = line;
                    console.log('✅ Updated KR category:', line);
                } else if (line.toLowerCase().includes('number of') ||
                    line.toLowerCase().includes('rate') ||
                    line.toLowerCase().includes('percentage')) {
                    // This looks like a metric
                    currentKR.metrics.push(line);
                    console.log('✅ Found metric (auto-detected):', line);
                }
            }
        }
    }

    // Save the last OKR
    if (currentOKR && currentOKR.buName) {
        okrs.push(currentOKR);
        console.log('💾 Saved final OKR for BU:', currentOKR.buName);
    }

    console.log(`📊 Parsed ${okrs.length} OKR(s) from document`);
    okrs.forEach((okr, index) => {
        console.log(`OKR ${index + 1}:`, {
            buName: okr.buName,
            objective: okr.objective,
            krCount: okr.keyResults.length
        });
    });

    return okrs;
}

/**
 * Import OKR(s) from Lark document URL
 * Returns an array of OKR objects (one per BU found in document)
 */
export async function importOKRFromLark(url) {
    const content = await fetchLarkDocument(url);
    const okrs = parseLarkDocumentToOKR(content);

    if (okrs.length === 0) {
        throw new Error('No OKRs found in document. Make sure document contains "BU Name:" headers.');
    }

    // Validate each OKR
    const invalidOKRs = okrs.filter(okr => !okr.buName || okr.keyResults.length === 0);
    if (invalidOKRs.length > 0) {
        console.warn('⚠️ Some OKRs are missing BU name or Key Results:', invalidOKRs);
    }

    // Filter out invalid OKRs
    const validOKRs = okrs.filter(okr => okr.buName && okr.keyResults.length > 0);

    if (validOKRs.length === 0) {
        throw new Error('No valid OKRs found. Each OKR must have a BU name and at least one Key Result.');
    }

    console.log(`✅ Successfully parsed ${validOKRs.length} valid OKR(s)`);
    return validOKRs;
}
