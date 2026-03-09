// SIMULATED AI RESPONSE
// This is what Gemini would return with your Strategic Compass prompt

const vmData = {
    metricName: "Increase My Folder Adoption within Candidate Search",
    description: "Increase employer adoption of My Folder as a core hiring workflow inside Candidate Search",
    bu: "My Talent Pool",
    baselineRate: "22.02",
    targetRate: "27.02",
    minVolume: "480"
};

// This is what the AI would analyze and return:
const aiResponse = {
    "score": 65,
    "insights": [
        "✅ Strong BU alignment: My Folder is a core My Talent Pool feature for employer workflow",
        "✅ Clear connection to 'Usage' KR: Folder adoption directly drives active employer engagement",
        "⚠️ Rationale could be stronger: Doesn't explain HOW folder usage leads to more active employers",
        "⚠️ Low volume impact: Only 480 employers affected - consider if effort justifies return",
        "📊 Decent improvement: 23% lift (22% → 27%) shows meaningful engagement increase"
    ],
    "suggestions": [
        "Expand rationale: Explain the user journey from folder adoption to becoming an active employer",
        "Add metrics: How many folder users become active vs non-users?",
        "Consider bundling: Combine with other My Talent Pool features for bigger impact",
        "Clarify definition: What counts as 'adoption'? First save? Regular usage?"
    ]
};

console.log("📊 SIMULATED AI ANALYSIS RESULT");
console.log("=".repeat(80));
console.log("\n🎯 VM: " + vmData.metricName);
console.log("📍 BU: " + vmData.bu);
console.log("\n" + "=".repeat(80));
console.log("\n📊 Score: " + aiResponse.score + "/100");
console.log("\n💡 Key Insights:");
aiResponse.insights.forEach((insight, i) => {
    console.log(`   ${i + 1}. ${insight}`);
});
console.log("\n🔧 Suggestions for Improvement:");
aiResponse.suggestions.forEach((suggestion, i) => {
    console.log(`   ${i + 1}. ${suggestion}`);
});
console.log("\n" + "=".repeat(80));
console.log("\n📋 WHAT WILL SHOW IN YOUR SIMPLIFIED MODAL:");
console.log("=".repeat(80));
console.log("\nScore: 65 / 100");
console.log("\n🔧 Improvements:");
aiResponse.suggestions.forEach((s, i) => {
    console.log(`   • ${s}`);
});
console.log("\n" + "=".repeat(80));
