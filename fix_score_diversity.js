// Unify and balance scoring prompts in analyzer.js
import fs from 'fs';

const analyzerPath = './src/services/analyzer.js';
let content = fs.readFileSync(analyzerPath, 'utf8');

// 1. Update analyzeBUWide prompt logic (balanced and natural)
const buPromptStart = 'const prompt = `Role: Strategic Advisor evaluating Value Metric (VM) alignment with multiple OKR Key Results.';
const buPromptEnd = '[AVAILABLE KEY RESULTS IN ${buName}]\\n${krList}`;';

const newBUPrompt = `const prompt = \`Role: Strategic Advisor evaluating Value Metric (VM) alignment with multiple OKR Key Results.
Task: Analyze which KR(s) this VM aligns with best. Return the best match and score.

CRITICAL SCORING RULES:
- **Check VM-KR relevance FIRST** - If VM has no clear connection to any KR, score = 0 (not a range, exactly 0)
- Be FAIR but STRICT - don't cluster all scores at one number (e.g., don't just give 75 for everything).
- Use the full 0-100 scale to differentiate between "Strong", "Good", and "Average" alignment.

Scoring Guidelines:
- Exceptional (85-100): VM directly measures KR metrics + excellent rationale + proven impact data
- Strong (70-84): VM clearly impacts KR + solid logical connection + good rationale
- Good (55-69): VM contributes to KR + reasonable logic + adequate rationale
- Moderate (35-54): VM relates to KR but connection could be clearer or rationale is thin
- Weak (1-34): VM has very weak or tangential connection to KR
- Poor (0): VM has NO clear connection to any KR - default to 0 if unrelated

**Typical related VMs should fall in the 50-75 range.** Only truly top-tier VMs score 80+.

Output JSON:
{ "score": <0-100>, "best_kr_index": <1-based index of best matching KR>, "insights": [<3-5 strings>], "suggestions": [<2-4 strings>] }

[VM DATA]
Name: \${vmData.metricName}
Desc: \${vmData.description}
BU: \${vmData.bu}
Rationale: \${vmData.okrRationale || 'Not provided'}

[AVAILABLE KEY RESULTS IN \${buName}]
\${krList}\`;`;

// Find and replace the BU-wide prompt
content = content.replace(/const prompt = `Role: Strategic Advisor evaluating Value Metric \(VM\) alignment with multiple OKR Key Results\.[\s\S]*?\[AVAILABLE KEY RESULTS IN \$\{buName\}\]\n\$\{krList\}`;/, newBUPrompt);

// 2. Update getAIAnalyzerReport prompt logic (synchronized with BU-wide)
const singlePromptStart = 'const prompt = `Role: Strategic Advisor evaluating Value Metric (VM) alignment with OKRs.';
const singlePromptEnd = 'Metrics: ${selectedKR.metrics.join(\', \')}`;';

const newSinglePrompt = `const prompt = \`Role: Strategic Advisor evaluating Value Metric (VM) alignment with OKRs.
Task: Analyze VM/OKR alignment. Reward sound logic and strong KR connections with appropriate scores.

CRITICAL SCORING RULES:
- Be FAIR but STRICT - prioritize cause-and-effect alignment.
- Use the full scale (0-100) to show quality differences.
- Don't just pick single numbers (like 75) for every good VM.

Scoring Guidelines:
- Exceptional (85-100): VM directly measures KR metrics + excellent rationale + proven impact data
- Strong (70-84): VM clearly impacts KR + solid logical connection + good rationale
- Good (55-69): VM contributes to KR + reasonable logic + adequate rationale
- Moderate (35-54): VM relates to KR but connection could be clearer or rationale is thin
- Weak (1-34): VM has very weak or tangential connection to KR
- Poor (0): VM has NO clear connection to any KR - default to 0 if unrelated

**Typical related VMs should fall in the 50-75 range.** Only truly top-tier VMs score 80+.

Output JSON:
{ "score": <0-100>, "insights": [<3-5 strings>], "suggestions": [<2-4 strings>] }

[VM DATA]
Name: \${vmData.metricName}
Desc: \${vmData.description}
BU: \${vmData.bu}
Stats: \${vmData.baselineRate}% -> \${vmData.targetRate}% (Min Vol: \${vmData.minVolume})
Rationale: \${vmData.okrRationale || 'Not provided'}

[OKR DATA]
\${okrData.quarter} | BU: \${okrData.buName}
Obj: \${okrData.objective}
KR: \${selectedKR.category}
Metrics: \${selectedKR.metrics.join(', ')}\`;`;

// Find and replace the single-OKR prompt
content = content.replace(/const prompt = `Role: Strategic Advisor evaluating Value Metric \(VM\) alignment with OKRs\.[\s\S]*?Metrics: \$\{selectedKR\.metrics\.join\(', '\)\}`;/, newSinglePrompt);

fs.writeFileSync(analyzerPath, content);
console.log('✅ Synchronized and balanced prompts in analyzer.js. Removed numeric anchors and enabled wider score distribution.');
