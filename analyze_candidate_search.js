import { analyzeComprehensive, toTOML } from './src/services/analyzer.js';

// VM: "Increase Number Of Saved Candidates In Candidate Search"
const vmData = {
    metricName: "Increase Number Of Saved Candidates In Candidate Search",
    description: "Improve the candidate search experience for employers by making it easier to save promising candidates for later review",
    baselineRate: "10",
    targetRate: "15",
    minVolume: "3000",
    bu: "My Talent Pool",
    selectedOKR: "okr-1733882756494-kr-001", // Assuming this links to the new My Talent Pool OKR
    okrRationale: "Saving candidates is a key indicator of employer engagement. By increasing the save rate, we directly improve the 'Number of jobseeker profiles being saved' metric in our Positive Result KR."
};

// My Talent Pool OKR
const okrData = {
    id: "okr-1733882756494",
    quarter: "2025 Q4",
    buName: "My Talent Pool",
    objective: "Happy Employer using AJT Product",
    keyResults: [
        {
            id: "kr-001",
            category: "Positive Result",
            pic: "Nikki",
            ratio: "50%",
            target: "W Oct: 500 points, W Nov: 2,000 points, W Dec: 5,000 points",
            projection: "Q4 W2",
            metrics: [
                "Number of newly paid My Talent Pool employers",
                "Number of recurring paid My Talent Pool employers",
                "Number of jobseeker profiles being saved, download resume from My Talent Pool",
                "Number of chats initiated by employer & responded (2 ways) from My Talent Pool"
            ]
        }
    ]
};

console.log("🔍 STRICT ANALYZER - Candidate Search VM");
console.log("=".repeat(80));
console.log("\n📋 VM: " + vmData.metricName);
console.log("📊 BU: " + vmData.bu);
console.log("📈 Metrics: " + vmData.baselineRate + "% → " + vmData.targetRate + "% (" + vmData.minVolume + " employers)");
console.log("🎯 OKR: " + okrData.objective);
console.log("\n" + "=".repeat(80));
console.log("⏳ Running strict analysis...\n");

analyzeComprehensive(vmData, okrData).then(result => {
    const tomlOutput = toTOML(result);
    console.log(tomlOutput);

    console.log("=".repeat(80));
    console.log("📊 SUMMARY");
    console.log("=".repeat(80));

    const avgScore = Math.round(
        (result.strategic_alignment.score +
            result.business_value.score +
            result.user_experience.score) / 3
    );

    console.log(`\n🎯 GATE STATUS: ${result.gate.status}`);
    console.log(`📊 AVERAGE SCORE: ${avgScore}/100`);

    if (result.gate.status === "FAILED") {
        console.log(`\n❌ VERDICT: ${result.gate.verdict}`);
        console.log(`📝 REASON: ${result.gate.reason}`);
    } else {
        console.log(`\n✅ VERDICT: PASSED - Ready for Decision Maker`);
        console.log(`\n📈 BREAKDOWN:`);
        console.log(`   Strategic Alignment: ${result.strategic_alignment.score}/100`);
        console.log(`   Business Value: ${result.business_value.score}/100`);
        console.log(`   User Experience: ${result.user_experience.score}/100`);
    }

    console.log("\n" + "=".repeat(80));
}).catch(err => console.error("Error:", err));
