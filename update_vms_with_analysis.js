// Script to update all VMs with analysis results
// Run this in browser console

const analysisResults = {
    "Increase number of profile update": {
        status: "approved",
        finalScore: 88,
        verdict: "APPROVED",
        priority: "High",
        confidence: "High",
        strategicScore: 80,
        businessScore: 95,
        uxScore: 90,
        absoluteGain: 1200,
        monthlyImpact: "+1200 conversions/month",
        roi: "Good",
        strengths: [
            "Strong strategic alignment with BU and OKR",
            "High business value and ROI",
            "Positive user experience impact",
            "Large scale impact (1200+ users)"
        ],
        concerns: ["None identified"],
        conditions: ["None"],
        nextSteps: [
            "Prioritize for next sprint",
            "Allocate engineering resources"
        ]
    },
    "Increase My Folder Adoption within Candidate Search": {
        status: "needs_improvement",
        finalScore: 52,
        verdict: "NEEDS_IMPROVEMENT",
        priority: "Low",
        confidence: "Low",
        strategicScore: 60,
        businessScore: 45,
        uxScore: 50,
        absoluteGain: 24,
        monthlyImpact: "+24 conversions/month",
        roi: "Moderate",
        strengths: ["None identified"],
        concerns: [
            "Limited business value - small impact",
            "Low scale (only 24 users affected)",
            "Critical issues flagged by analyzer"
        ],
        conditions: ["Significant improvements required"],
        nextSteps: [
            "Revise VM proposal",
            "Consider alternative approaches"
        ]
    }
};

// Get existing VMs
const vms = JSON.parse(localStorage.getItem('austina_vms') || '[]');
console.log(`Found ${vms.length} VMs in localStorage`);

// Update each VM with analysis results
let updatedCount = 0;
const updatedVMs = vms.map(vm => {
    const analysis = analysisResults[vm.metricName];

    if (analysis) {
        console.log(`✅ Updating: ${vm.metricName}`);
        updatedCount++;

        return {
            ...vm,
            status: analysis.status,
            decisionMakerAnalysis: {
                verdict: analysis.verdict,
                finalScore: analysis.finalScore,
                priority: analysis.priority,
                confidence: analysis.confidence,
                scoreBreakdown: {
                    strategic: analysis.strategicScore,
                    business: analysis.businessScore,
                    ux: analysis.uxScore
                },
                businessImpact: {
                    absoluteGain: analysis.absoluteGain,
                    monthlyImpact: analysis.monthlyImpact,
                    roi: analysis.roi
                },
                reasoning: {
                    strengths: analysis.strengths,
                    concerns: analysis.concerns
                },
                conditions: analysis.conditions,
                nextSteps: analysis.nextSteps,
                timestamp: new Date().toISOString(),
                agent: "Decision Maker"
            }
        };
    } else {
        console.log(`⚠️ No analysis for: ${vm.metricName}`);
        return vm;
    }
});

// Save back to localStorage
localStorage.setItem('austina_vms', JSON.stringify(updatedVMs));

console.log(`\n✅ Updated ${updatedCount} VMs with analysis results`);
console.log('Reload the page to see changes!');
