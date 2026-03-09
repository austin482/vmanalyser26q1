import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision, decisionToTOML } from './src/services/decisionMaker.js';

// VM: "Increase Number Of Saved Candidates In Candidate Search"
const vmData = {
    metricName: "Increase Number Of Saved Candidates In Candidate Search",
    description: "Improve the candidate search experience for employers by making it easier to save promising candidates for later review",
    baselineRate: "10",
    targetRate: "15",
    minVolume: "3000",
    bu: "My Talent Pool",
    selectedOKR: "okr-1733882756494-kr-001",
    okrRationale: "Saving candidates is a key indicator of employer engagement. By increasing the save rate, we directly improve the 'Number of jobseeker profiles being saved' metric in our Positive Result KR."
};

const okrData = {
    id: "okr-1733882756494",
    quarter: "2025 Q4",
    buName: "My Talent Pool",
    objective: "Happy Employer using AJT Product",
    keyResults: [{
        id: "kr-001",
        category: "Positive Result",
        metrics: [
            "Number of newly paid My Talent Pool employers",
            "Number of recurring paid My Talent Pool employers",
            "Number of jobseeker profiles being saved, download resume from My Talent Pool"
        ]
    }]
};

console.log("🎯 DECISION MAKER - Final Verdict");
console.log("=".repeat(80));
console.log("\n📋 VM: " + vmData.metricName);
console.log("📊 Metrics: " + vmData.baselineRate + "% → " + vmData.targetRate + "% (" + vmData.minVolume + " employers)");
console.log("\n" + "=".repeat(80));
console.log("⏳ Running analysis and decision...\n");

async function runFullAnalysis() {
    // Step 1: Analyzer
    console.log("📊 STEP 1: ANALYZER REPORT");
    console.log("─".repeat(80));
    const analyzerReport = await analyzeComprehensive(vmData, okrData);
    console.log(`Strategic Alignment: ${analyzerReport.strategic_alignment.score}/100`);
    console.log(`Business Value: ${analyzerReport.business_value.score}/100`);
    console.log(`User Experience: ${analyzerReport.user_experience.score}/100`);

    // Step 2: Decision Maker
    console.log("\n🎯 STEP 2: DECISION MAKER VERDICT");
    console.log("─".repeat(80));
    const decision = makeDecision(analyzerReport, vmData);
    const tomlOutput = decisionToTOML(decision);
    console.log(tomlOutput);

    console.log("=".repeat(80));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(80));
    console.log(`\n🎯 VERDICT: ${decision.decision.verdict}`);
    console.log(`📊 FINAL SCORE: ${decision.decision.final_score}/100`);
    console.log(`⭐ PRIORITY: ${decision.decision.priority}`);
    console.log(`🎲 CONFIDENCE: ${decision.decision.confidence}`);

    if (decision.conditions[0] !== "None") {
        console.log(`\n⚠️ CONDITIONS (${decision.conditions.length}):`);
        decision.conditions.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
    }

    console.log(`\n📝 NEXT STEPS:`);
    decision.next_steps.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

    console.log("\n" + "=".repeat(80));
}

runFullAnalysis().catch(err => console.error("Error:", err));
