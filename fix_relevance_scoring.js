// Make scoring stricter about VM-KR relevance - unrelated VMs should score 0-20
import fs from 'fs';

const analyzerPath = './src/services/analyzer.js';
let content = fs.readFileSync(analyzerPath, 'utf8');

// Find the BU-wide prompt and add strict relevance checking
const oldPattern = /CRITICAL SCORING RULES:\s+- \*\*TYPICAL VMs should score 55-70\*\* - this is the normal range\s+- VMs with excellent logic AND clear KR connection may score 70-80\s+- Only truly exceptional VMs with proven impact should score 80\+\s+- Be STRICT - err on the side of lower scores\s+- Use the full scoring range - don't cluster scores at the high end/;

const newRules = `CRITICAL SCORING RULES:
- **Check VM-KR relevance FIRST** - If VM has no clear connection to any KR, score 0-20 maximum
- **TYPICAL related VMs should score 55-70** - this is the normal range
- VMs with excellent logic AND clear KR connection may score 70-80
- Only truly exceptional VMs with proven impact should score 80+
- Be STRICT - err on the side of lower scores
- Use the full scoring range - don't force connections that don't exist`;

content = content.replace(oldPattern, newRules);

// Also update the Poor/Weak ranges to emphasize low scores for unrelated VMs
content = content.replace(
    /- Moderate \(30-44\): VM relates to KR \+ some logic but connection could be clearer\s+- Weak \(15-29\): VM has weak connection to KR \+ unclear logic\s+- Poor \(0-14\): VM has minimal or no connection to KR/,
    `- Moderate (30-44): VM has indirect/weak connection to KR
- Weak (15-29): VM has very weak/tangential connection to KR
- **Poor (0-14): VM has NO clear connection to any KR** - use this range often!`
);

fs.writeFileSync(analyzerPath, content);
console.log('✅ Updated scoring to be strict about VM-KR relevance - unrelated VMs will score 0-20');
