// Test all 3 current VMs with the new threshold (< 20)
import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision } from './src/services/decisionMaker.js';

const positiveResultOKR = {
    id: "q4-w1",
    quarter: "Q4 W1",
    buName: "Happy Jobseeker Using MKRB",
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

const vms = [
    {
        metricName: "Increase number of profile update",
        description: "Encourage jobseekers to update their profiles regularly",
        bu: "JS Product",
        baselineRate: "45",
        targetRate: "60",
        minVolume: "5000",
        selectedOKR: "q4-w1-kr1",
        okrRationale: "More profile updates lead to better job matches and higher placement rates"
    },
    {
        metricName: "Update Applied Job Status from Email",
        description: "Track job application outcomes via email notifications",
        bu: "JS Product",
        baselineRate: "30",
        targetRate: "50",
        minVolume: "3000",
        selectedOKR: "q4-w1-kr1",
        okrRationale: "Tracking application status helps measure successful hires and placement rates"
    },
    {
        metricName: "Increase Social Media Reach",
        description: "Increase Social Media Reach from facebook and instagram so more jobseeker know us",
        bu: "Marketing",
        baselineRate: "10",
        targetRate: "15",
        minVolume: "5000",
        selectedOKR: "q4-w1-kr1",
        okrRationale: "More social media reach means more people know about us"
    }
];

console.log('🧪 Testing All 3 VMs with New Threshold (< 20)\n');
console.log('='.repeat(70));

for (const vm of vms) {
    console.log(`\n📋 VM: ${vm.metricName}`);
    console.log(`Description: ${vm.description}`);
    console.log(`OKR: ${positiveResultOKR.keyResults[0].category} - ${positiveResultOKR.keyResults[0].metrics[0]}`);
    console.log('-'.repeat(70));

    try {
        const result = await analyzeComprehensive(vm, positiveResultOKR);
        const decision = makeDecision(result, vm);

        console.log('Gate Status:', result.gate.status);
        if (result.gate.status === 'FAILED') {
            console.log('Failed Gate:', result.gate.failed_gate);
            console.log('Reason:', result.gate.reason);
        }

        console.log('Strategic Score:', result.strategic_alignment.score);
        console.log('Business Score:', result.business_value.score);
        console.log('UX Score:', result.user_experience.score);
        console.log('\n🎯 Final Score:', decision.decision.final_score);
        console.log('Verdict:', decision.decision.verdict);
        console.log('Priority:', decision.decision.priority);

        if (decision.decision.final_score === 0) {
            console.log('⚠️  WARNING: Got score 0 - check if this is correct!');
        } else {
            console.log('✅ Got non-zero score');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    console.log('='.repeat(70));
}

console.log('\n✅ Test complete!');
