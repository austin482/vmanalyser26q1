// Test script to verify multi-BU Lark import parsing

const testDocument = `
2026 Q1

BU Name: JS Product - Application
Objective: Improve User Engagement

KR 1: Increase active users
- Daily active users
- Monthly active users

KR 2: Improve conversion rate
- Application completion rate
- Profile completion rate

BU Name: Marketing
Objective: Expand Market Reach

KR 1: Increase brand awareness
- Social media impressions
- Website traffic

KR 2: Improve lead generation
- Number of qualified leads
- Lead conversion rate

BU Name: My Talent Pool
Objective: Enhance Recruiter Tools

KR 1: Improve candidate engagement
- Candidate response rate
- Saved candidate actions
`;

// Import the parser
import { parseLarkDocumentToOKR } from '../src/services/larkService.js';

console.log('🧪 Testing Multi-BU Parser\n');
console.log('='.repeat(60));

const result = parseLarkDocumentToOKR(testDocument);

console.log('\n📊 RESULTS:');
console.log('='.repeat(60));
console.log(`Total OKRs parsed: ${result.length}\n`);

result.forEach((okr, index) => {
    console.log(`\nOKR #${index + 1}:`);
    console.log(`  Quarter: ${okr.quarter}`);
    console.log(`  BU Name: ${okr.buName}`);
    console.log(`  Objective: ${okr.objective}`);
    console.log(`  Key Results: ${okr.keyResults.length}`);
    okr.keyResults.forEach((kr, krIndex) => {
        console.log(`    KR ${krIndex + 1}: ${kr.category}`);
        console.log(`      Metrics: ${kr.metrics.join(', ')}`);
    });
});

console.log('\n' + '='.repeat(60));
console.log('✅ Test complete!');
