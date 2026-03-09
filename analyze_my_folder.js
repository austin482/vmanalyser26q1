import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision, decisionToTOML } from './src/services/decisionMaker.js';

// VM: "Increase My Folder Adoption within Candidate Search"
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
        metrics: [
            "Number of employers opt-in to My Talent Pool",
            "Number of active employers in My Talent Pool employers",
            "Number of broadcast/hiring campaigns activated"
        ]
    }]
};

console.log("🎯 FULL ANALYSIS - My Folder Adoption VM");
console.log("=".repeat(80));
console.log("\n📋 VM: " + vmData.metricName);
console.log("📊 Metrics: " + vmData.baselineRate + "% → " + vmData.targetRate + "% (" + vmData.minVolume + " employers)");
console.log("📈 Improvement: " + ((parseFloat(vmData.targetRate) - parseFloat(vmData.baselineRate)) / parseFloat(vmData.baselineRate) * 100).toFixed(1) + "%");
console.log("\n" + "=".repeat(80));

async function runFullAnalysis() {
    // Step 1: Analyzer
    console.log("\n📊 STEP 1: ANALYZER REPORT");
    console.log("─".repeat(80));
    const analyzerReport = await analyzeComprehensive(vmData, okrData);

    console.log(`\n[gate]`);
    console.log(`status = "${analyzerReport.gate.status}"`);

    console.log(`\n[scores]`);
    console.log(`strategic_alignment = ${analyzerReport.strategic_alignment.score}/100`);
    console.log(`business_value = ${analyzerReport.business_value.score}/100`);
    console.log(`user_experience = ${analyzerReport.user_experience.score}/100`);

    console.log(`\n[business_impact]`);
    console.log(`absolute_gain = ${analyzerReport.business_value.absolute_gain} employers`);
    console.log(`monthly_impact = "${analyzerReport.business_value.monthly_impact}"`);
    console.log(`roi = "${analyzerReport.business_value.roi}"`);

    // Step 2: Decision Maker
    console.log("\n\n🎯 STEP 2: DECISION MAKER VERDICT");
    console.log("─".repeat(80));
    const decision = makeDecision(analyzerReport, vmData);
    const tomlOutput = decisionToTOML(decision);
    console.log(tomlOutput);

    console.log("\n" + "=".repeat(80));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(80));
    console.log(`\n🎯 VERDICT: ${decision.decision.verdict}`);
    console.log(`📊 FINAL SCORE: ${decision.decision.final_score}/100`);
    console.log(`⭐ PRIORITY: ${decision.decision.priority}`);
    console.log(`🎲 CONFIDENCE: ${decision.decision.confidence}`);

    console.log(`\n✅ STRENGTHS:`);
    decision.reasoning.strengths.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

    console.log(`\n⚠️ CONCERNS:`);
    decision.reasoning.concerns.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));

    if (decision.conditions[0] !== "None") {
        console.log(`\n📋 CONDITIONS:`);
        decision.conditions.forEach((c, i) => console.log(`   ${i + 1}. ${c}`));
    }

    console.log(`\n📝 NEXT STEPS:`);
    decision.next_steps.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

    console.log("\n" + "=".repeat(80));
}

runFullAnalysis().catch(err => console.error("Error:", err));
