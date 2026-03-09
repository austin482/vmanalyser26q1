// Make unrelated VMs score exactly 0, not 0-20 range
import fs from 'fs';

const analyzerPath = './src/services/analyzer.js';
let content = fs.readFileSync(analyzerPath, 'utf8');

// Update the critical scoring rules to default to 0 for unrelated VMs
const oldPattern = /CRITICAL SCORING RULES:\s+- \*\*Check VM-KR relevance FIRST\*\* - If VM has no clear connection to any KR, score 0-20 maximum/;

const newRule = `CRITICAL SCORING RULES:
- **Check VM-KR relevance FIRST** - If VM has no clear connection to any KR, score = 0 (not a range, exactly 0)`;

content = content.replace(oldPattern, newRule);

// Also update the Poor range description
content = content.replace(
    /- \*\*Poor \(0-14\): VM has NO clear connection to any KR\*\* - use this range often!/,
    `- **Poor (0): VM has NO clear connection to any KR** - default to 0 if unrelated
- Very Weak (1-14): VM has extremely weak/forced connection`
);

// Add explicit instruction in the prompt
content = content.replace(
    /Scoring Guidelines:/,
    `**IMPORTANT: Score = 0 if VM doesn't relate to any KR. Don't force connections.**

Scoring Guidelines:`
);

fs.writeFileSync(analyzerPath, content);
console.log('✅ Updated: Unrelated VMs now score exactly 0 (not 0-20)');
