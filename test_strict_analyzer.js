import { analyzeComprehensive, toTOML } from './src/services/analyzer.js';

const okrData = {
    id: "okr-001",
    quarter: "2025 Q1",
    buName: "JS Product",
    objective: "Happy Jobseeker Using MKRB",
    keyResults: [{
        id: "kr-001",
        category: "Usage",
        metrics: ["Profile completion rate", "Job application submission rate"]
    }]
};

// Test 3 VMs with different scenarios
const vms = [
    {
        name: "VM #1: Profile Update (SHOULD PASS)",
        data: {
            metricName: "Increase number of profile update",
            description: "Encourage jobseekers to update their profiles by showing a progress bar and offering profile completion rewards",
            baselineRate: "30",
            targetRate: "45",
            minVolume: "8000",
            bu: "JS Product",
            selectedOKR: "okr-001-kr-001",
            okrRationale: "Profile updates directly improve engagement metrics"
        }
    },
    {
        name: "VM #2: Social Media (SHOULD REJECT - Wrong BU)",
        data: {
            metricName: "Increase Social Media Reach",
            description: "Run Facebook and Instagram ads to increase brand awareness",
            baselineRate: "2",
            targetRate: "5",
            minVolume: "500",
            bu: "JS Product",
            selectedOKR: "okr-001-kr-001",
            okrRationale: "More reach brings more users"
        }
    },
    {
        name: "VM #3: Email Status (SHOULD REJECT - Employer dependency)",
        data: {
            metricName: "Update Applied Job Status from Email",
            description: "Automatically update job application status when employers send status update emails",
            baselineRate: "5",
            targetRate: "10",
            minVolume: "2500",
            bu: "JS Product",
            selectedOKR: "okr-001-kr-001",
            okrRationale: "Helps jobseekers track applications"
        }
    }
];

async function runTests() {
    console.log("🔍 STRICT ANALYZER - Testing with 3 VMs");
    console.log("=".repeat(80));

    for (const vm of vms) {
        console.log(`\n\n📋 ${vm.name}`);
        console.log("─".repeat(80));

        const result = await analyzeComprehensive(vm.data, okrData);
        const tomlOutput = toTOML(result);

        console.log(tomlOutput);

        // Summary
        const avgScore = Math.round(
            (result.strategic_alignment.score +
                result.business_value.score +
                result.user_experience.score) / 3
        );

        console.log("─".repeat(80));
        console.log(`📊 AVERAGE SCORE: ${avgScore}/100`);
        console.log(`🎯 GATE STATUS: ${result.gate.status}`);

        if (result.gate.status === "FAILED") {
            console.log(`❌ VERDICT: ${result.gate.verdict} - ${result.gate.reason}`);
        } else {
            console.log(`✅ VERDICT: PASSED - Proceed to Decision Maker`);
        }
    }

    console.log("\n\n" + "=".repeat(80));
    console.log("✅ STRICT GATING DEMONSTRATION COMPLETE");
    console.log("=".repeat(80));
}

runTests().catch(err => console.error("Error:", err));
