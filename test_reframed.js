// Test: Reframed VM - "Auto-Update Job Application Status in Profile"
import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision } from './src/services/decisionMaker.js';

const reframedVM = {
    metricName: "Auto-Update Job Application Status in Profile",
    description: "Automatically sync and display job application status updates in the jobseeker's profile dashboard, helping them track progress without leaving the platform",
    baselineRate: "15",
    targetRate: "45",
    minVolume: "2000",
    bu: "JS Product",
    selectedOKR: "okr-1733882756494-kr-001",
    okrRationale: "Real-time status visibility in profile keeps jobseekers engaged with the platform and helps them take timely actions on their applications, leading to more positive result behaviors"
};

const okrData = {
    id: "okr-1733882756494",
    quarter: "2025 Q4",
    buName: "JS Product",
    objective: "Happy Jobseeker with Positive Result",
    keyResults: [{
        id: "kr-001",
        category: "Outcome",
        metrics: ["Number of jobseekers with positive result behavior"]
    }]
};

async function test() {
    console.log("🔍 REFRAMED VM TEST\n");
    console.log("=".repeat(80));
    console.log("Original: 'Update Applied Job Status from Email'");
    console.log("Reframed: 'Auto-Update Job Application Status in Profile'");
    console.log("=".repeat(80));

    const analysis = await analyzeComprehensive(reframedVM, okrData);
    const decision = makeDecision(analysis, reframedVM);

    console.log(`\n📊 Score: ${decision.decision.final_score}/100`);
    console.log(`🎯 Verdict: ${decision.decision.verdict}`);
    console.log(`⭐ Priority: ${decision.decision.priority}`);
    console.log(`📈 Improvement: ${((45 - 15) / 15 * 100).toFixed(0)}% lift (15% → 45%)`);
    console.log(`👥 Volume: 2000 users`);

    console.log("\n💡 Key Insights:");
    if (analysis.overall_insights) {
        analysis.overall_insights.forEach((insight, i) => {
            console.log(`   ${i + 1}. ${insight}`);
        });
    }

    console.log("\n🔧 Improvements:");
    if (analysis.red_flags) {
        analysis.red_flags.forEach((flag, i) => {
            console.log(`   ${i + 1}. ${flag}`);
        });
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ RESULT: This reframing should score MUCH higher!");
    console.log("   - Focuses on product feature (profile dashboard)");
    console.log("   - Clearly JS Product's responsibility");
    console.log("   - No BU ownership red flags");
}

test();
