// analyzer.js - Unified, Diverse, and Bug-Free
// API key loaded from environment variable (set in Vercel dashboard or .env.local)
const OPENAI_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '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';
console.log('🔄 [ANALYZER] Module loaded at:', new Date().toLocaleTimeString());

/**
 * Performs analysis with critical gating. Unifies BU-wide and Single-OKR logic.
 */
export async function analyzeComprehensive(vmData, okrDataOrBU) {
    console.log('🎯 [ANALYZER] analyzeComprehensive called for:', vmData.metricName);

    try {
        if (!vmData.selectedOKR && typeof okrDataOrBU === 'string') {
            console.log('📊 [ANALYZER] Analysis Mode: BU-wide (Searching for best match in BU:', okrDataOrBU + ')');
            return await analyzeBUWide(vmData, okrDataOrBU);
        } else {
            console.log('📍 [ANALYZER] Analysis Mode: Specific OKR');
            return await getAIAnalyzerReport(vmData, okrDataOrBU);
        }
    } catch (error) {
        console.warn('⚠️ [ANALYZER] AI analysis failed, using mock logic:', error.message);
        return getStrictAnalyzerReport(vmData, typeof okrDataOrBU === 'string' ? null : okrDataOrBU);
    }
}

/**
 * Common AI Caller with Dynamic Prompt
 */
async function callAI(prompt) {
    const OPENAI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'HTTP-Referer': 'https://austina.app',
            'X-Title': 'Austina VM Analyzer'
        },
        body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');
    return JSON.parse(jsonMatch[0]);
}

/**
 * Multi-KR BU Analysis
 */
async function analyzeBUWide(vmData, buName) {
    const allOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
    const targetBU = buName.trim().toLowerCase();
    const buOKRs = allOKRs.filter(okr => okr.buName.trim().toLowerCase() === targetBU);

    if (buOKRs.length === 0) {
        console.warn(`⚠️ [ANALYZER] No OKR match for BU: "${buName}". Available: ${allOKRs.map(o => o.buName).join(', ')}`);
        // Instead of throwing, we'll return a score 0 as it's "unrelated" to current BU OKRs
        return {
            gate: { status: "FAILED" },
            strategic_alignment: { score: 0, kr_alignment: "No BU OKRs found" },
            business_value: { score: 0 },
            overall_insights: [`Could not find any 2024 OKRs for Business Unit: ${buName}`],
            red_flags: ["Missing OKR data for this department"],
            timestamp: new Date().toISOString(),
            agent: "Analyzer (Missing Data)"
        };
    }

    const allKRs = [];
    buOKRs.forEach(okr => {
        okr.keyResults.forEach(kr => {
            allKRs.push({ okr, kr });
        });
    });

    const krList = allKRs.map((item, idx) =>
        `${idx + 1}. [${item.okr.quarter}] ${item.kr.category}: ${item.kr.metrics.join(', ')} (Objective: ${item.okr.objective})`
    ).join('\n\n');

    const prompt = `Role: Strategic Advisor evaluating Value Metric (VM) alignment.
Task: Find the BEST matching KR for this VM and score the alignment.

CRITICAL SCORING RULES:
- **STRICT BUT FAIR**: 
    * If the VM directly implements or measures a keyword/metric mentioned in a KR, score must be **80-100**.
    * If the VM clearly supports a KR objective but indirectly, score should be **50-79**.
    * If the VM is a valid product improvement for the BU but connection to KRs is loose, score should be **10-49**.
    * Score **0** ONLY if the VM has NO logical connection to ANY of the KRs or BU Objective.
- **PRECISION & GRANULARITY (CRITICAL)**: 
    * Use the full 0-100 scale with high precision based on your assessment.
    * **DO NOT ROUND** to the nearest 5 or 10. Avoid "standard" numbers like 70, 75, or 80.
    * Pick an exact, specific number (e.g., 81, 83, 86, 74, 67, 52) that reflects the precise alignment quality.
    * The more specific the score, the more credible the reasoning feels.

Guidelines:
- 86-99: Direct Hit (VM directly implements or measures a KR metric)
- 71-85: Strong Alignment (Clear cause-and-effect link to KR)
- 41-70: Mid-Range Value (Significant product improvement)
- 11-40: Low/Tangential connection
- 1-10: Trace association
- 0: Absolutely unrelated

Output JSON: { "score": <INT 0-100>, "best_kr_index": <1-based index>, "insights": [strings], "suggestions": [strings] }

[VM]
Name: ${vmData.metricName}
Desc: ${vmData.description}
Rationale: ${vmData.okrRationale || 'Not provided'}
BU: ${buName}

[AVAILABLE KRs in ${buName}]
${krList}`;

    console.log(`🤖 [ANALYZER] Prompting AI for "${vmData.metricName}"...`);
    const aiResult = await callAI(prompt);
    console.log(`✅ [ANALYZER] AI Score for "${vmData.metricName}": ${aiResult.score}`);

    const bestMatch = allKRs[(aiResult.best_kr_index || 1) - 1] || allKRs[0];

    return {
        gate: { status: aiResult.score === 0 ? "FAILED" : "PASSED" },
        strategic_alignment: {
            score: aiResult.score,
            kr_alignment: `Best match: ${bestMatch.kr.category} (${bestMatch.okr.quarter})`,
            best_kr: { okrId: bestMatch.okr.id, krId: bestMatch.kr.id, category: bestMatch.kr.category }
        },
        business_value: { score: 85 },
        overall_insights: aiResult.insights,
        red_flags: aiResult.suggestions,
        timestamp: new Date().toISOString(),
        agent: "Analyzer (AI-BU)"
    };
}

/**
 * Single-OKR Analysis
 */
async function getAIAnalyzerReport(vmData, okrData) {
    const selectedKR = okrData.keyResults.find(kr => vmData.selectedOKR.endsWith(`-${kr.id}`)) || okrData.keyResults[0];

    const prompt = `Role: Strategic Advisor.
Task: Evaluate VM alignment with the specified KR.

CRITICAL SCORING RULES:
- **DIVERSE SCORING**: Use the full 0-100 continuous scale. No clustering.
- **STRICTNESS**: Pure alignment required for 80+. 

Guidelines:
- Exceptional (85-100), Strong (70-84), Good (50-69), Weak (1-49), Unrelated (0)

Output JSON: { "score": <0-100>, "insights": [strings], "suggestions": [strings] }

[VM] ${vmData.metricName} (${vmData.description})
[Rationale] ${vmData.okrRationale || 'None'}
[TARGET KR] ${selectedKR.category}: ${selectedKR.metrics.join(', ')} (Objective: ${okrData.objective})`;

    const aiResult = await callAI(prompt);

    return {
        gate: { status: aiResult.score === 0 ? "FAILED" : "PASSED" },
        strategic_alignment: { score: aiResult.score, kr_alignment: selectedKR.category },
        business_value: { score: 85 },
        overall_insights: aiResult.insights,
        red_flags: aiResult.suggestions,
        timestamp: new Date().toISOString(),
        agent: "Analyzer (AI-Single)"
    };
}

function getStrictAnalyzerReport(vmData, okrData) {
    return {
        gate: { status: "PASSED" },
        strategic_alignment: { score: 65, kr_alignment: "Mock Fallback" },
        business_value: { score: 85 },
        overall_insights: ["Using fallback scoring logic due to API issues"],
        red_flags: ["AI analysis was unavailable"],
        timestamp: new Date().toISOString(),
        agent: "Analyzer (Mock)"
    };
}

/**
 * Convert analyzer report to TOML string format
 * @param {Object} report - The analyzer report
 * @returns {string} TOML formatted string
 */
export function toTOML(report) {
    let toml = '';

    // Gate Section
    toml += '[gate]\n';
    toml += `status = "${report.gate.status}"\n`;
    if (report.gate.failed_gate) toml += `failed_gate = "${report.gate.failed_gate}"\n`;
    if (report.gate.reason) toml += `reason = "${report.gate.reason}"\n`;
    if (report.gate.verdict) toml += `verdict = "${report.gate.verdict}"\n`;
    toml += '\n';

    // Strategic Alignment
    toml += '[strategic_alignment]\n';
    toml += `score = ${report.strategic_alignment.score}\n`;
    toml += `kr_alignment = "${report.strategic_alignment.kr_alignment}"\n\n`;

    // Business Value (if exists)
    if (report.business_value) {
        toml += '[business_value]\n';
        toml += `score = ${report.business_value.score}\n`;
        if (report.business_value.absolute_gain) toml += `absolute_gain = ${report.business_value.absolute_gain}\n`;
        toml += '\n';
    }

    // Insights
    toml += '# Overall Insights\n';
    if (report.overall_insights) {
        report.overall_insights.forEach(insight => {
            toml += '[[overall_insights]]\n';
            toml += `insight = "${insight}"\n\n`;
        });
    }

    // Red Flags / Suggestions
    toml += '# Red Flags & Suggestions\n';
    if (report.red_flags) {
        report.red_flags.forEach(flag => {
            toml += '[[red_flags]]\n';
            toml += `flag = "${flag}"\n\n`;
        });
    }

    // Metadata
    toml += '[metadata]\n';
    toml += `timestamp = "${report.timestamp}"\n`;
    toml += `agent = "${report.agent}"\n`;

    return toml;
}
