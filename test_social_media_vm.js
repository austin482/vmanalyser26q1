// Test: Social Media Reach VM Analysis
// This VM should get score 0 because it's linked to "Positive Result" KR
// but measures "social media reach" (acquisition metric)

import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision } from './src/services/decisionMaker.js';

const socialMediaVM = {
    metricName: "Increase Social Media Reach",
    description: "Increase Social Media Reach from facebook and instagram so more jobseeker know us",
    bu: "Marketing",
    baselineRate: "10",
    targetRate: "15",
    minVolume: "5000",
    selectedOKR: "q4-w1-kr1", // Linked to "Positive Result" KR
    okrRationale: "More social media reach means more people know about us"
};

const positiveResultOKR = {
    id: "q4-w1",
    quarter: "Q4 W1",
    buName: "Marketing",
    objective: "Happy Jobseeker Using MKRB",
    keyResults: [
        {
            id: "kr1",
            category: "Positive Result",
            metrics: ["Job placement rate", "Successful hires", "Jobseeker satisfaction"],
            ratio: "40%",
            target: "70% job placement rate"
        }
    ]
};

console.log('🧪 Testing: Social Media Reach VM\n');
console.log('VM:', socialMediaVM.metricName);
console.log('Linked to KR:', positiveResultOKR.keyResults[0].category);
console.log('KR Metrics:', positiveResultOKR.keyResults[0].metrics.join(', '));
console.log('\n' + '='.repeat(60) + '\n');

try {
    const result = await analyzeComprehensive(socialMediaVM, positiveResultOKR);

    console.log('📊 ANALYSIS RESULT:');
    console.log('Gate Status:', result.gate.status);

    if (result.gate.status === 'FAILED') {
        console.log('Failed Gate:', result.gate.failed_gate);
        console.log('Reason:', result.gate.reason);
        console.log('\n❌ Red Flags:');
        result.red_flags.forEach(flag => console.log('  -', flag));
    }

    console.log('\nStrategic Score:', result.strategic_alignment.score);
    console.log('Business Score:', result.business_value.score);
    console.log('UX Score:', result.user_experience.score);

    const decision = makeDecision(result, socialMediaVM);
    console.log('\n🎯 FINAL DECISION:');
    console.log('Verdict:', decision.decision.verdict);
    console.log('Priority:', decision.decision.priority);
    console.log('Final Score:', decision.decision.final_score);

    console.log('\n' + '='.repeat(60));

    if (decision.decision.final_score === 0) {
        console.log('\n✅ CORRECT: VM got score 0 (doesn\'t align with OKR)');
    } else {
        console.log('\n❌ ISSUE: VM got score', decision.decision.final_score, '(should be 0)');
        console.log('\nWhy: "Social media reach" is an ACQUISITION metric');
        console.log('But KR measures "Positive Result" (job placements, hires)');
        console.log('These don\'t align!');
    }

} catch (error) {
    console.error('Error:', error.message);
}
