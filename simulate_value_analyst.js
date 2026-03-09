import { analyzeRealityCheck } from './src/services/realityCheck.js';

// Example VM: "Update Applied Job Status from Email"
const exampleVM = {
    metricName: "Update Applied Job Status from Email",
    description: "Automatically update job application status when employers send status update emails, reducing manual tracking effort",
    baselineRate: "5",      // 5% of applications get auto-updated
    targetRate: "10",       // Target: 10% auto-update rate
    minVolume: "2500",      // 2,500 applications per month
    bu: "JS Product"
};

console.log("🔍 Value Impact Analyst Simulation");
console.log("=".repeat(50));
console.log("\n📋 VM Details:");
console.log(`Name: ${exampleVM.metricName}`);
console.log(`Description: ${exampleVM.description}`);
console.log(`Baseline: ${exampleVM.baselineRate}% → Target: ${exampleVM.targetRate}%`);
console.log(`Volume: ${exampleVM.minVolume} applications`);
console.log("\n" + "=".repeat(50));

// Calculate metrics manually to show the logic
const baseline = parseFloat(exampleVM.baselineRate);
const target = parseFloat(exampleVM.targetRate);
const volume = parseInt(exampleVM.minVolume);

const absoluteLift = target - baseline; // 5%
const percentLift = (absoluteLift / baseline) * 100; // 100%
const absoluteGain = (absoluteLift / 100) * volume; // 125 applications

console.log("\n📊 VALUE CALCULATION:");
console.log(`Absolute Lift: ${absoluteLift}% (${target}% - ${baseline}%)`);
console.log(`Relative Improvement: ${percentLift.toFixed(0)}%`);
console.log(`Absolute Gain: ${absoluteGain} auto-updated applications/month`);

console.log("\n💯 SCORING LOGIC:");
console.log("─".repeat(50));

// Business Value Score (60 points)
let businessScore = 0;
if (absoluteGain > 1000) {
    businessScore = 60;
    console.log("✅ Business Value: 60/60 points");
    console.log(`   → ${absoluteGain} applications > 1000 = MASSIVE VALUE`);
} else if (absoluteGain > 500) {
    businessScore = 50;
    console.log("✅ Business Value: 50/60 points");
    console.log(`   → ${absoluteGain} applications > 500 = HIGH VALUE`);
} else if (absoluteGain > 100) {
    businessScore = 35;
    console.log("⚠️ Business Value: 35/60 points");
    console.log(`   → ${absoluteGain} applications > 100 = GOOD VALUE`);
} else if (absoluteGain > 20) {
    businessScore = 20;
    console.log("⚠️ Business Value: 20/60 points");
    console.log(`   → ${absoluteGain} applications > 20 = MODERATE VALUE`);
} else {
    businessScore = 5;
    console.log("❌ Business Value: 5/60 points");
    console.log(`   → ${absoluteGain} applications < 20 = LOW VALUE`);
}

// ROI Score (40 points)
let roiScore = 0;
if (percentLift > 50 && volume > 1000) {
    roiScore = 40;
    console.log("✅ ROI: 40/40 points");
    console.log(`   → ${percentLift.toFixed(0)}% lift + ${volume} volume = EXCELLENT ROI`);
} else if (percentLift > 20 && volume > 500) {
    roiScore = 35;
    console.log("✅ ROI: 35/40 points");
    console.log(`   → ${percentLift.toFixed(0)}% lift + ${volume} volume = GOOD ROI`);
} else if (percentLift > 10 && volume > 100) {
    roiScore = 25;
    console.log("⚠️ ROI: 25/40 points");
    console.log(`   → ${percentLift.toFixed(0)}% lift + ${volume} volume = ACCEPTABLE ROI`);
} else {
    roiScore = 10;
    console.log("❌ ROI: 10/40 points");
    console.log(`   → ${percentLift.toFixed(0)}% lift + ${volume} volume = QUESTIONABLE ROI`);
}

const finalScore = businessScore + roiScore;

console.log("\n" + "=".repeat(50));
console.log(`🎯 FINAL SCORE: ${finalScore}/100`);
console.log("=".repeat(50));

console.log("\n📈 INSIGHTS:");
console.log(`💰 Value: +${absoluteGain} auto-updated applications/month (${absoluteLift}% absolute lift)`);
console.log(`📊 Impact: ${percentLift.toFixed(0)}% relative improvement (doubling the baseline!)`);
console.log(`⚠️ Moderate volume (${volume} applications) limits total impact`);

if (finalScore >= 70) {
    console.log(`✅ Delivers good business value`);
} else if (finalScore >= 50) {
    console.log(`⚠️ Moderate business value - consider if effort justifies return`);
} else {
    console.log(`❌ Low business value - may not justify development effort`);
}

console.log("\n✨ VERDICT:");
if (finalScore >= 70) {
    console.log("WORTH BUILDING - Good business case");
} else if (finalScore >= 50) {
    console.log("CONSIDER CAREFULLY - Moderate value, assess effort required");
} else {
    console.log("LOW PRIORITY - Limited business impact");
}
