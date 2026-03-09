import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision } from './src/services/decisionMaker.js';

const vmData = {
    metricName: "Increase My Folder Adoption within Candidate Search",
    description: "Increase employer adoption of My Folder as a core hiring workflow inside Candidate Search",
    baselineRate: "22.02",
    targetRate: "27.02",
    minVolume: "480",
    bu: "My Talent Pool",
    selectedOKR: "okr-1733882756494-kr-002",
    okrRationale: "Increase employer adoption of My Folder as a core hiring workflow inside Candidate Search"
};

const okrData = {
    id: "okr-1733882756494",
    quarter: "2025 Q4",
    buName: "My Talent Pool",
    objective: "Happy Employer using AJT Product",
    keyResults: [{
        id: "kr-002",
        category: "Usage",
        metrics: ["Number of employers opt-in to My Talent Pool", "Number of active employers"]
    }]
};

console.log("🤖 TESTING AI ANALYSIS");
console.log("=".repeat(80));
console.log("\n📋 VM: " + vmData.metricName);
console.log("📊 BU: " + vmData.bu);
console.log("\n" + "=".repeat(80));
console.log("⏳ Calling Gemini API...\n");

async function testAIAnalysis() {
    try {
        // Step 1: Analyzer (with AI)
        const analyzerReport = await analyzeComprehensive(vmData, okrData);

        console.log("✅ AI ANALYSIS COMPLETE\n");
        console.log("📊 ANALYZER REPORT:");
        console.log("─".repeat(80));
        console.log(`Gate Status: ${analyzerReport.gate.status}`);
        console.log(`Strategic Score: ${analyzerReport.strategic_alignment.score}/100`);
        console.log(`Business Score: ${analyzerReport.business_value.score}/100`);
        console.log(`UX Score: ${analyzerReport.user_experience.score}/100`);

        console.log("\n💡 AI-GENERATED INSIGHTS:");
        analyzerReport.overall_insights.forEach((insight, i) => {
            console.log(`   ${i + 1}. ${insight}`);
        });

        console.log("\n🚩 RED FLAGS / SUGGESTIONS:");
        analyzerReport.red_flags.forEach((flag, i) => {
            console.log(`   ${i + 1}. ${flag}`);
        });

        // Step 2: Decision Maker
        const decision = makeDecision(analyzerReport, vmData);

        console.log("\n\n🎯 DECISION MAKER VERDICT:");
        console.log("─".repeat(80));
        console.log(`Verdict: ${decision.decision.verdict}`);
        console.log(`Final Score: ${decision.decision.final_score}/100`);
        console.log(`Priority: ${decision.decision.priority}`);
        console.log(`Confidence: ${decision.decision.confidence}`);

        console.log("\n\n" + "=".repeat(80));
        console.log("📋 WHAT WILL SHOW IN UI:");
        console.log("=".repeat(80));
        console.log("\n💡 Key Insights:");
        analyzerReport.overall_insights.forEach((insight, i) => {
            console.log(`   ${i + 1}. ${insight}`);
        });
        console.log(`   \n   🎯 Verdict: ${decision.decision.verdict}`);
        console.log(`   ⭐ Priority: ${decision.decision.priority}`);
        console.log(`   📊 Final Score: ${decision.decision.final_score}/100`);

        console.log("\n🔧 Suggestions to Improve:");
        const suggestions = analyzerReport.red_flags.filter(f => f !== "None identified");
        suggestions.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s}`);
        });

        console.log("\n" + "=".repeat(80));

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        console.error("\nThis might mean:");
        console.error("1. API key quota exhausted");
        console.error("2. Network issue");
        console.error("3. API endpoint changed");
        console.error("\nFalling back to mock logic...");
    }
}

testAIAnalysis();
