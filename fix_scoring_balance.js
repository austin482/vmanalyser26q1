// Adjust BU-wide prompt to balanced scoring (not too strict, not too generous)
import fs from 'fs';

const analyzerPath = './src/services/analyzer.js';
let content = fs.readFileSync(analyzerPath, 'utf8');

// Find and replace the BU-wide prompt scoring rules
content = content.replace(
    /CRITICAL SCORING RULES:\s+- \*\*TYPICAL VMs should score 40-60\*\* - this is the normal range\s+- VMs with excellent logic AND clear KR connection may score 60-75\s+- Only truly exceptional VMs with proven impact should score 75\+/,
    `CRITICAL SCORING RULES:
- **TYPICAL VMs should score 55-70** - this is the normal range
- VMs with excellent logic AND clear KR connection may score 70-80
- Only truly exceptional VMs with proven impact should score 80+`
);

content = content.replace(
    /- Exceptional \(75-100\): VM directly measures KR metrics \+ excellent rationale \+ proven impact data \+ complete stats\s+- Excellent \(60-74\): VM clearly impacts KR \+ solid logical connection \+ good rationale \+ measurable outcomes\s+- \*\*Good \(45-59\): MOST VMs should fall here\*\* - VM contributes to KR \+ reasonable logic \+ adequate rationale/,
    `- Exceptional (80-100): VM directly measures KR metrics + excellent rationale + proven impact data + complete stats
- Excellent (70-79): VM clearly impacts KR + solid logical connection + good rationale + measurable outcomes
- **Good (60-69): MOST VMs should fall here** - VM contributes to KR + reasonable logic + adequate rationale`
);

content = content.replace(
    /- "Increase chat engagement" for "Number of 2-way chats" KR = 55 \(good fit but basic description, no rationale\)\s+- "Improve job alert conversion" for "Good Result for Jobseeker" KR = 50 \(related but indirect impact\)\s+- VM with detailed rationale \+ data \+ clear KR link = 70\+/,
    `- "Increase chat engagement" for "Number of 2-way chats" KR = 65 (good fit but basic description)
- "Improve job alert conversion" for "Good Result for Jobseeker" KR = 62 (related but indirect impact)
- VM with detailed rationale + data + clear KR link = 75+`
);

fs.writeFileSync(analyzerPath, content);
console.log('✅ Updated BU-wide prompt to balanced scoring (55-70 typical, 60-75 most VMs)');
