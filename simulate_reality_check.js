
import { analyzeRealityCheck } from './src/services/realityCheck.js';

// Sample VM Data
const sampleVM = {
    metricName: "One-Click Apply Implementation",
    description: "Make it easier for jobseekers to apply by removing redundant steps and pre-filling data from their profile. This will reduce friction and improve the application experience.",
    baselineRate: "15",
    targetRate: "20",  // 33% Lift
    minVolume: "5000",
    bu: "JS Product"
};

console.log("🔍 Simulating Reality Check Analysis...");
console.log("----------------------------------------");
console.log("VM:", sampleVM.metricName);
console.log("Description:", sampleVM.description);
console.log(`Baseline: ${sampleVM.baselineRate}% -> Target: ${sampleVM.targetRate}%`);
console.log("----------------------------------------");

// Run Analysis
analyzeRealityCheck(sampleVM).then(result => {
    console.log("\n📊 ANALYSIS OUTCOME:");
    console.log(JSON.stringify(result, null, 2));
}).catch(err => {
    console.error("Error:", err);
});
