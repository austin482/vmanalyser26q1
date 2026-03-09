// Test: Strict OKR Alignment Gate
// This demonstrates the new GATE 3 that rejects VMs that don't align with their selected OKR

import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision } from './src/services/decisionMaker.js';

// Test Case 1: VM that DOESN'T align with OKR (should get score 0)
const misalignedVM = {
    metricName: "Facebook Ad Campaign CTR",
    description: "Improve click-through rate on Facebook ads for jobseeker acquisition",
    bu: "JS Product",
    baselineRate: "2.5",
    targetRate: "3.5",
    minVolume: "10000",
    selectedOKR: "q1-2025-kr1", // This links to a "Usage" KR
    okrRationale: "More clicks on ads will bring more users"
};

const usageOKR = {
    id: "q1-2025",
    quarter: "Q1 2025",
    buName: "JS Product",
    objective: "Increase jobseeker engagement",
    keyResults: [
        {
            id: "kr1",
            category: "Usage",
            metrics: ["Profile completion rate", "Active users per month"],
            ratio: "40%",
            target: "60% profile completion"
        }
    ]
};

// Test Case 2: VM that DOES align with OKR (should pass)
const alignedVM = {
    metricName: "Profile Completion Wizard",
    description: "Add step-by-step wizard to help users complete their profile faster and easier",
    bu: "JS Product",
    baselineRate: "45",
    targetRate: "60",
    minVolume: "5000",
    selectedOKR: "q1-2025-kr1",
    okrRationale: "The wizard will guide users through profile completion, directly increasing the profile completion rate metric in our Usage KR. Users who complete profiles are more likely to become active users."
};

console.log('🧪 Testing Strict OKR Alignment Gate\n');
console.log('='.repeat(60));

// Test misaligned VM
console.log('\n📋 TEST 1: Misaligned VM (Facebook Ads → Usage KR)');
console.log('Expected: Score 0, "VM doesn\'t match with OKR"\n');

try {
    const result1 = await analyzeComprehensive(misalignedVM, usageOKR);
    console.log('Gate Status:', result1.gate.status);
    console.log('Failed Gate:', result1.gate.failed_gate);
    console.log('Reason:', result1.gate.reason);
    console.log('Strategic Score:', result1.strategic_alignment.score);
    console.log('Red Flags:', result1.red_flags);

    const decision1 = makeDecision(result1, misalignedVM);
    console.log('\n🎯 Decision:', decision1.decision.verdict);
    console.log('Priority:', decision1.decision.priority);
    console.log('Final Score:', decision1.decision.final_score);
} catch (error) {
    console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(60));

// Test aligned VM
console.log('\n📋 TEST 2: Aligned VM (Profile Wizard → Usage KR)');
console.log('Expected: Pass gates, score > 60\n');

try {
    const result2 = await analyzeComprehensive(alignedVM, usageOKR);
    console.log('Gate Status:', result2.gate.status);
    console.log('Strategic Score:', result2.strategic_alignment.score);
    console.log('Business Score:', result2.business_value.score);
    console.log('UX Score:', result2.user_experience.score);
    console.log('\nInsights:', result2.overall_insights.slice(0, 3));

    const decision2 = makeDecision(result2, alignedVM);
    console.log('\n🎯 Decision:', decision2.decision.verdict);
    console.log('Priority:', decision2.decision.priority);
    console.log('Final Score:', decision2.decision.final_score);
} catch (error) {
    console.error('Error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Test complete!');
