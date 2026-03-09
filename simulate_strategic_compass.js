import { analyzeStrategicAlignment } from './src/services/strategicCompass.js';

// Example VM: "Update Applied Job Status from Email"
const vmData = {
    id: "test-vm-001",
    metricName: "Update Applied Job Status from Email",
    description: "Automatically update job application status when employers send status update emails, reducing manual tracking effort",
    baselineRate: "5",
    targetRate: "10",
    minVolume: "2500",
    bu: "JS Product",
    selectedOKR: "okr-001-kr-001",
    okrRationale: "This feature helps jobseekers stay informed about their application status without manual effort, directly improving the user experience and engagement metrics tracked in our Usage KR.",
    status: "pending_analysis"
};

// Mock OKR data
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

console.log("🧭 Strategic Compass Analysis");
console.log("=".repeat(60));
console.log("\n📋 VM Details:");
console.log(`Name: ${vmData.metricName}`);
console.log(`BU: ${vmData.bu}`);
console.log(`Description: ${vmData.description}`);
console.log(`Baseline: ${vmData.baselineRate}% → Target: ${vmData.targetRate}%`);
console.log(`Volume: ${vmData.minVolume} applications`);

console.log("\n🎯 Related OKR:");
console.log(`Quarter: ${okrData.quarter}`);
console.log(`Objective: ${okrData.objective}`);
console.log(`Key Result: ${okrData.keyResults[0].category} - ${okrData.keyResults[0].target}`);
console.log(`KR Metrics: ${okrData.keyResults[0].metrics.join(', ')}`);

console.log("\n" + "=".repeat(60));
console.log("⏳ Running Strategic Compass Analysis...\n");

// Run analysis
analyzeStrategicAlignment(vmData, okrData).then(result => {
    console.log("📊 ANALYSIS RESULT:");
    console.log("=".repeat(60));
    console.log(JSON.stringify(result, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("📈 BREAKDOWN:");
    console.log("─".repeat(60));
    console.log(`\n🎯 Score: ${result.score}/100`);
    console.log(`\n💡 Insights (${result.insights.length}):`);
    result.insights.forEach((insight, i) => {
        console.log(`   ${i + 1}. ${insight}`);
    });
    console.log(`\n🔧 Suggestions (${result.suggestions.length}):`);
    result.suggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
    });

    console.log("\n" + "=".repeat(60));
}).catch(err => {
    console.error("Error:", err);
});
