// STRICT STRATEGIC COMPASS ANALYSIS - TEST SIMULATION
// This shows how the new logic will score different VM submissions

console.log("=".repeat(80));
console.log("STRATEGIC COMPASS - STRICT ANALYSIS SIMULATION");
console.log("=".repeat(80));

// Test Case 1: MISALIGNED VM (Social Media for JS Product)
console.log("\n📊 TEST CASE 1: Social Media Reach (MISALIGNED)");
console.log("-".repeat(80));

const badVM = {
    bu: "JS Product",
    metricName: "Increase Social Media Reach from facebook",
    description: "Increase our Facebook page reach to get more visibility",
    baselineRate: "5",
    targetRate: "6.5",
    minVolume: "10000",
    selectedOKR: "okr-123-kr-2",
    okrRationale: "Social media will increase awareness and drive users to update their profiles"
};

const okr = {
    quarter: "Q4 W1",
    buName: "JS Product",
    objective: "Happy Jobseeker Using MKRB",
    keyResults: [
        {
            id: "kr-2",
            category: "Usage",
            ratio: "25%",
            metrics: ["Number of profiles updated (AI assist)", "Number of new users created"]
        }
    ]
};

console.log("\n🔍 ANALYSIS:");

let score = 0;
const insights = [];
const suggestions = [];

// 1. BU CONTEXT (40 points) - STRICT
console.log("\n1️⃣ BU CONTEXT & DAILY OPERATIONS (40 points max):");
const vmText = (badVM.metricName + " " + badVM.description).toLowerCase();
const isJSProduct = badVM.bu.toLowerCase().includes("js product");

if (isJSProduct) {
    // Check for JS Product keywords
    const jsKeywords = ["jobseeker", "profile", "resume", "job search", "application"];
    const hasJSKeywords = jsKeywords.some(kw => vmText.includes(kw));

    // Check for anti-keywords (things JS Product shouldn't do)
    const antiKeywords = ["social media", "facebook", "marketing", "campaign", "ads"];
    const hasAntiKeywords = antiKeywords.some(kw => vmText.includes(kw));

    if (hasAntiKeywords) {
        score += 0;
        insights.push("❌ CRITICAL: This is marketing work, NOT JS Product's responsibility");
        suggestions.push("STOP: Reassign to Marketing BU or redefine as a product feature");
        console.log("   Score: 0/40 ❌");
        console.log("   Reason: Social media is marketing work, not product development");
    } else if (hasJSKeywords) {
        score += 35;
        insights.push("✅ VM aligns with JS Product's core work (jobseeker features)");
        console.log("   Score: 35/40 ✅");
    } else {
        score += 15;
        insights.push("⚠️ VM relevance to JS Product is unclear");
        console.log("   Score: 15/40 ⚠️");
    }
}

// 2. INDEPENDENT KR VERIFICATION (30 points) - VERY STRICT
console.log("\n2️⃣ INDEPENDENT KR ALIGNMENT (30 points max):");
const krMetrics = okr.keyResults[0].metrics.join(" ").toLowerCase();
console.log(`   Selected KR: "${okr.keyResults[0].category}"`);
console.log(`   KR Metrics: ${okr.keyResults[0].metrics.join(", ")}`);
console.log(`   VM Metric: ${badVM.metricName}`);

// Check if VM metric actually relates to KR metrics
const vmMeasures = vmText.includes("reach") || vmText.includes("visibility");
const krMeasures = krMetrics.includes("profile") || krMetrics.includes("users");

if (vmMeasures && !krMeasures) {
    score += 0;
    insights.push("❌ VM measures 'reach' but KR measures 'profiles updated' - DIFFERENT metrics");
    suggestions.push("Redefine VM to measure actual profile update behavior, not marketing reach");
    console.log("   Score: 0/30 ❌");
    console.log("   Reason: Reach ≠ Profile Updates (completely different metrics)");
} else if (vmText.includes("profile") && krMetrics.includes("profile")) {
    score += 25;
    insights.push("✅ VM directly measures the same metric as KR");
    console.log("   Score: 25/30 ✅");
} else {
    score += 10;
    insights.push("⚠️ Weak connection between VM and KR metrics");
    console.log("   Score: 10/30 ⚠️");
}

// 3. RATIONALE QUALITY (20 points) - CRITICAL THINKING
console.log("\n3️⃣ RATIONALE QUALITY (20 points max):");
console.log(`   Rationale: "${badVM.okrRationale}"`);

const rationaleLength = badVM.okrRationale.length;
const hasCausalLink = badVM.okrRationale.toLowerCase().includes("because") ||
    badVM.okrRationale.toLowerCase().includes("will cause");
const hasEvidence = badVM.okrRationale.toLowerCase().includes("data") ||
    badVM.okrRationale.toLowerCase().includes("shows");

if (rationaleLength > 100 && hasCausalLink && hasEvidence) {
    score += 20;
    insights.push("✅ Detailed rationale with clear causal mechanism and evidence");
    console.log("   Score: 20/20 ✅");
} else if (rationaleLength > 50 && hasCausalLink) {
    score += 12;
    insights.push("⚠️ Rationale explains causation but lacks evidence");
    console.log("   Score: 12/20 ⚠️");
} else if (rationaleLength > 30) {
    score += 5;
    insights.push("❌ Rationale is vague and speculative - no clear mechanism");
    suggestions.push("Explain HOW this VM will cause the KR improvement (with evidence)");
    console.log("   Score: 5/20 ❌");
    console.log("   Reason: Assumes 'awareness → updates' without proof");
} else {
    score += 0;
    insights.push("❌ No meaningful rationale provided");
    console.log("   Score: 0/20 ❌");
}

// 4. METRIC COHERENCE (10 points) - IGNORE PRESET
console.log("\n4️⃣ METRIC COHERENCE (10 points max):");
console.log(`   Baseline: ${badVM.baselineRate}% → Target: ${badVM.targetRate}%`);

// Check if the improvement makes sense for THIS TYPE of feature
const improvement = ((parseFloat(badVM.targetRate) / parseFloat(badVM.baselineRate) - 1) * 100);
console.log(`   Improvement: ${improvement.toFixed(0)}%`);

// CRITICAL: Does this improvement make sense for what the VM actually does?
if (vmText.includes("social media") || vmText.includes("marketing")) {
    score += 0;
    insights.push("❌ Improvement target is irrelevant - measuring wrong metric");
    console.log("   Score: 0/10 ❌");
    console.log("   Reason: Can't measure 'conversion' for social media reach");
} else if (improvement >= 20 && improvement <= 50) {
    score += 10;
    insights.push("✅ Realistic improvement target");
    console.log("   Score: 10/10 ✅");
} else {
    score += 5;
    insights.push("⚠️ Improvement target needs validation");
    console.log("   Score: 5/10 ⚠️");
}

// FINAL SCORE
console.log("\n" + "=".repeat(80));
console.log(`📊 FINAL SCORE: ${score}/100`);
console.log("=".repeat(80));

console.log("\n💡 KEY INSIGHTS:");
insights.forEach((insight, i) => console.log(`   ${i + 1}. ${insight}`));

console.log("\n🔧 CRITICAL SUGGESTIONS:");
suggestions.forEach((suggestion, i) => console.log(`   ${i + 1}. ${suggestion}`));

console.log("\n🚨 RECOMMENDATION:");
if (score < 40) {
    console.log("   ❌ DO NOT PROCEED - Major misalignment detected");
    console.log("   This VM should be rejected or completely redefined");
} else if (score < 70) {
    console.log("   ⚠️ NEEDS IMPROVEMENT - Significant issues to address");
} else {
    console.log("   ✅ APPROVED - Strong alignment with OKR");
}

// ============================================================================
// TEST CASE 2: WELL-ALIGNED VM
// ============================================================================

console.log("\n\n" + "=".repeat(80));
console.log("📊 TEST CASE 2: AI-Assisted Profile Completion (WELL-ALIGNED)");
console.log("-".repeat(80));

const goodVM = {
    bu: "JS Product",
    metricName: "AI-Assisted Profile Completion Feature",
    description: "Add AI suggestions to help jobseekers complete their profiles faster and more thoroughly",
    baselineRate: "45",
    targetRate: "60",
    minVolume: "5000",
    selectedOKR: "okr-123-kr-2",
    okrRationale: "This feature directly increases profile completion rate because AI suggestions reduce friction and guide users through the process. Historical data shows AI-assisted flows have 30-40% higher completion rates."
};

console.log("\n🔍 QUICK ANALYSIS:");
console.log("   BU Context: ✅ Product feature (not marketing)");
console.log("   KR Alignment: ✅ Directly measures 'profiles updated'");
console.log("   Rationale: ✅ Clear mechanism + evidence");
console.log("   Metrics: ✅ Realistic improvement (33%)");
console.log("\n   📊 ESTIMATED SCORE: 85-90/100 ✅");

console.log("\n" + "=".repeat(80));
console.log("This is how the STRICT agent will think!");
console.log("=".repeat(80));
