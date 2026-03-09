// Analyze 2 VMs with mock logic (all API keys exhausted)
import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision } from './src/services/decisionMaker.js';

// VM 1: Update Applied Job Status from Email
const vm1 = {
    metricName: "Update Applied Job Status from Email",
    description: "Automatically update jobseeker's applied job status when employer sends status update emails",
    baselineRate: "15",
    targetRate: "45",
    minVolume: "2000",
    bu: "JS Product",
    selectedOKR: "okr-1733882756494-kr-001",
    okrRationale: "Helps jobseekers track application progress, leading to more positive result behaviors"
};

// VM 2: Increase Social Media Reach
const vm2 = {
    metricName: "Increase Social Media Reach",
    description: "Increase reach of job postings on social media platforms to attract more candidates",
    baselineRate: "8",
    targetRate: "15",
    minVolume: "5000",
    bu: "JS Product",
    selectedOKR: "okr-1733882756494-kr-001",
    okrRationale: "More social media reach leads to more jobseekers discovering opportunities"
};

const okrData = {
    id: "okr-1733882756494",
    quarter: "2025 Q4",
    buName: "JS Product",
    objective: "Happy Jobseeker with Positive Result",
    keyResults: [{
        id: "kr-001",
        category: "Outcome",
        metrics: ["Number of jobseekers with positive result behavior", "Conversion rate from application to interview"]
    }]
};

async function analyzeVMs() {
    console.log("🤖 ANALYZING 2 VMS (Mock Logic - All API Keys Exhausted)\n");
    console.log("=".repeat(80));

    // Analyze VM 1
    console.log("\n📋 VM 1: Update Applied Job Status from Email");
    console.log("─".repeat(80));
    const analysis1 = await analyzeComprehensive(vm1, okrData);
    const decision1 = makeDecision(analysis1, vm1);

    console.log(`\n📊 Score: ${decision1.decision.final_score}/100`);
    console.log(`🎯 Verdict: ${decision1.decision.verdict}`);
    console.log(`⭐ Priority: ${decision1.decision.priority}`);

    console.log("\n💡 Key Insights:");
    if (analysis1.overall_insights) {
        analysis1.overall_insights.forEach((insight, i) => {
            console.log(`   ${i + 1}. ${insight}`);
        });
    }

    console.log("\n🔧 Improvements:");
    if (analysis1.red_flags) {
        analysis1.red_flags.forEach((flag, i) => {
            console.log(`   ${i + 1}. ${flag}`);
        });
    }

    // Analyze VM 2
    console.log("\n\n" + "=".repeat(80));
    console.log("\n📋 VM 2: Increase Social Media Reach");
    console.log("─".repeat(80));
    const analysis2 = await analyzeComprehensive(vm2, okrData);
    const decision2 = makeDecision(analysis2, vm2);

    console.log(`\n📊 Score: ${decision2.decision.final_score}/100`);
    console.log(`🎯 Verdict: ${decision2.decision.verdict}`);
    console.log(`⭐ Priority: ${decision2.decision.priority}`);

    console.log("\n💡 Key Insights:");
    if (analysis2.overall_insights) {
        analysis2.overall_insights.forEach((insight, i) => {
            console.log(`   ${i + 1}. ${insight}`);
        });
    }

    console.log("\n🔧 Improvements:");
    if (analysis2.red_flags) {
        analysis2.red_flags.forEach((flag, i) => {
            console.log(`   ${i + 1}. ${flag}`);
        });
    }

    console.log("\n\n" + "=".repeat(80));
    console.log("📊 COMPARISON");
    console.log("=".repeat(80));
    console.log(`VM 1: ${decision1.decision.final_score}/100 - ${decision1.decision.verdict}`);
    console.log(`VM 2: ${decision2.decision.final_score}/100 - ${decision2.decision.verdict}`);
}

analyzeVMs();
