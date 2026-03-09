// Fix BU-wide analysis prompt to use strict scoring
import fs from 'fs';

const analyzerPath = './src/services/analyzer.js';
let content = fs.readFileSync(analyzerPath, 'utf8');

// Find and replace the BU-wide prompt (around lines 71-97)
const oldBUPrompt = /const prompt = `Role: Strategic Advisor evaluating Value Metric \(VM\) alignment with multiple OKR Key Results\.[\s\S]*?\[AVAILABLE KEY RESULTS IN \$\{buName\}\]\s+\$\{krList\}`/;

const newBUPrompt = `const prompt = \`Role: Strategic Advisor evaluating Value Metric (VM) alignment with multiple OKR Key Results.
Task: Analyze which KR(s) this VM aligns with best. Return the best match and score.

CRITICAL SCORING RULES:
- **TYPICAL VMs should score 40-60** - this is the normal range
- VMs with excellent logic AND clear KR connection may score 60-75
- Only truly exceptional VMs with proven impact should score 75+
- Be STRICT - err on the side of lower scores
- Use the full scoring range - don't cluster scores at the high end

Scoring Guidelines:
- Exceptional (75-100): VM directly measures KR metrics + excellent rationale + proven impact data + complete stats
- Excellent (60-74): VM clearly impacts KR + solid logical connection + good rationale + measurable outcomes
- **Good (45-59): MOST VMs should fall here** - VM contributes to KR + reasonable logic + adequate rationale
- Moderate (30-44): VM relates to KR + some logic but connection could be clearer
- Weak (15-29): VM has weak connection to KR + unclear logic
- Poor (0-14): VM has minimal or no connection to KR

SCORING EXAMPLES:
- "Increase chat engagement" for "Number of 2-way chats" KR = 55 (good fit but basic description, no rationale)
- "Improve job alert conversion" for "Good Result for Jobseeker" KR = 50 (related but indirect impact)
- VM with detailed rationale + data + clear KR link = 70+

Output JSON:
{ "score": <0-100>, "best_kr_index": <1-based index of best matching KR>, "insights": [<3-5 strings>], "suggestions": [<2-4 strings>] }

[VM DATA]
Name: \${vmData.metricName}
Desc: \${vmData.description}
BU: \${vmData.bu}
Rationale: \${vmData.okrRationale || 'Not provided'}

[AVAILABLE KEY RESULTS IN \${buName}]
\${krList}\``;

content = content.replace(oldBUPrompt, newBUPrompt);

fs.writeFileSync(analyzerPath, content);
console.log('✅ Updated BU-wide analysis prompt to use strict scoring criteria');
