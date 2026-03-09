// Test OpenAI API with the reframed VM
import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision } from './src/services/decisionMaker.js';

const vm = {
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
    console.log("🤖 TESTING OPENAI API\n");
    console.log("=".repeat(80));

    const analysis = await analyzeComprehensive(vm, okrData);
    const decision = makeDecision(analysis, vm);

    console.log(`\n✅ AI ANALYSIS COMPLETE!\n`);
    console.log(`📊 Score: ${decision.decision.final_score}/100`);
    console.log(`🎯 Verdict: ${decision.decision.verdict}`);
    console.log(`⭐ Priority: ${decision.decision.priority}`);
    console.log(`🤖 Agent: ${analysis.agent}`);

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
}

test();
