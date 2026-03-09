import { analyzeComprehensive } from './src/services/analyzer.js';

// Example VM: "Increase number of profile update"
const vmData = {
    id: "vm-001",
    metricName: "Increase number of profile update",
    description: "Encourage jobseekers to update their profiles by showing a progress bar and offering profile completion rewards",
    baselineRate: "30",
    targetRate: "45",
    minVolume: "8000",
    bu: "JS Product",
    selectedOKR: "okr-001-kr-001",
    okrRationale: "Profile updates are a key indicator of user engagement. By increasing the profile completion rate, we directly improve the 'active jobseeker engagement' metric tracked in our Usage KR. Complete profiles also lead to better job matches.",
    status: "pending_analysis"
};

const okrData = {
    id: "okr-001",
    quarter: "2025 Q1",
    buName: "JS Product",
    objective: "Happy Jobseeker Using MKRB",
    owners: "Austin, Product Team",
    keyResults: [
        {
            id: "kr-001",
            category: "Usage",
            pic: "Austin",
            ratio: "40%",
            target: "Increase active jobseeker engagement by 25%",
            projection: "On track",
            metrics: [
                "Profile completion rate",
                "Job application submission rate",
                "Return visit frequency"
            ]
        }
    ]
};

console.log("🔍 ANALYZER AGENT - Comprehensive Analysis");
console.log("=".repeat(70));
console.log("\n📋 VM: " + vmData.metricName);
console.log("📊 Metrics: " + vmData.baselineRate + "% → " + vmData.targetRate + "% (" + vmData.minVolume + " users)");
console.log("🎯 OKR: " + okrData.objective + " - " + okrData.keyResults[0].category);
console.log("\n" + "=".repeat(70));
console.log("⏳ Running comprehensive analysis...\n");

analyzeComprehensive(vmData, okrData).then(result => {
    console.log("📊 ANALYZER REPORT");
    console.log("=".repeat(70));
    console.log(JSON.stringify(result, null, 2));

    console.log("\n" + "=".repeat(70));
    console.log("📈 SUMMARY VIEW");
    console.log("=".repeat(70));

    console.log("\n1️⃣ STRATEGIC ALIGNMENT: " + result.strategicAlignment.score + "/100");
    console.log("   BU Fit: " + result.strategicAlignment.buContextFit);
    console.log("   KR Fit: " + result.strategicAlignment.krAlignment);
    if (result.strategicAlignment.concerns.length > 0) {
        console.log("   ⚠️ Concerns:");
        result.strategicAlignment.concerns.forEach(c => console.log("      - " + c));
    }

    console.log("\n2️⃣ BUSINESS VALUE: " + result.businessValue.score + "/100");
    console.log("   Impact: " + result.businessValue.monthlyImpact);
    console.log("   ROI: " + result.businessValue.roi);
    console.log("   Absolute Gain: " + result.businessValue.absoluteGain + " users");

    console.log("\n3️⃣ USER EXPERIENCE: " + result.userExperience.score + "/100");
    console.log("   Sentiment: " + result.userExperience.sentiment);
    console.log("   Reasoning: " + result.userExperience.reasoning);

    console.log("\n💡 OVERALL INSIGHTS:");
    result.overallInsights.forEach((insight, i) => {
        console.log("   " + (i + 1) + ". " + insight);
    });

    console.log("\n🚩 RED FLAGS:");
    result.redFlags.forEach((flag, i) => {
        console.log("   " + (i + 1) + ". " + flag);
    });

    console.log("\n" + "=".repeat(70));
}).catch(err => {
    console.error("Error:", err);
});
