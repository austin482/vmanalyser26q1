import { analyzeComprehensive } from './src/services/analyzer.js';

// ===== VM 1: "Update Applied Job Status from Email" =====
const vm1 = {
    metricName: "Update Applied Job Status from Email",
    description: "Automatically update job application status when employers send status update emails, reducing manual tracking effort",
    baselineRate: "5",
    targetRate: "10",
    minVolume: "2500",
    bu: "JS Product",
    selectedOKR: "okr-001-kr-001",
    okrRationale: "This feature helps jobseekers stay informed about their application status without manual effort, directly improving the user experience and engagement metrics tracked in our Usage KR.",
};

// ===== VM 2: "Increase Social Media Reach" =====
const vm2 = {
    metricName: "Increase Social Media Reach",
    description: "Run Facebook and Instagram ads to increase brand awareness and drive more traffic to the platform",
    baselineRate: "2",
    targetRate: "5",
    minVolume: "500",
    bu: "JS Product",
    selectedOKR: "okr-001-kr-001",
    okrRationale: "More social media reach will bring more users to the platform.",
};

const okrData = {
    id: "okr-001",
    quarter: "2025 Q1",
    buName: "JS Product",
    objective: "Happy Jobseeker Using MKRB",
    keyResults: [
        {
            id: "kr-001",
            category: "Usage",
            pic: "Austin",
            ratio: "40%",
            target: "Increase active jobseeker engagement by 25%",
            metrics: ["Profile completion rate", "Job application submission rate", "Return visit frequency"]
        }
    ]
};

async function runComparison() {
    console.log("🔍 ANALYZER AGENT - Comparison of 2 VMs");
    console.log("=".repeat(80));

    // Analyze VM 1
    console.log("\n📋 VM #1: Update Applied Job Status from Email");
    console.log("─".repeat(80));
    const result1 = await analyzeComprehensive(vm1, okrData);

    console.log("\n📊 SCORES:");
    console.log(`   Strategic Alignment: ${result1.strategicAlignment.score}/100`);
    console.log(`   Business Value: ${result1.businessValue.score}/100`);
    console.log(`   User Experience: ${result1.userExperience.score}/100`);

    console.log("\n💡 KEY FINDINGS:");
    console.log(`   BU Fit: ${result1.strategicAlignment.buContextFit}`);
    console.log(`   Impact: ${result1.businessValue.monthlyImpact}`);
    console.log(`   ROI: ${result1.businessValue.roi}`);
    console.log(`   UX: ${result1.userExperience.sentiment}`);

    if (result1.redFlags[0] !== "None identified") {
        console.log("\n🚩 RED FLAGS:");
        result1.redFlags.forEach(flag => console.log(`   - ${flag}`));
    }

    // Analyze VM 2
    console.log("\n\n" + "=".repeat(80));
    console.log("📋 VM #2: Increase Social Media Reach");
    console.log("─".repeat(80));
    const result2 = await analyzeComprehensive(vm2, okrData);

    console.log("\n📊 SCORES:");
    console.log(`   Strategic Alignment: ${result2.strategicAlignment.score}/100`);
    console.log(`   Business Value: ${result2.businessValue.score}/100`);
    console.log(`   User Experience: ${result2.userExperience.score}/100`);

    console.log("\n💡 KEY FINDINGS:");
    console.log(`   BU Fit: ${result2.strategicAlignment.buContextFit}`);
    console.log(`   Impact: ${result2.businessValue.monthlyImpact}`);
    console.log(`   ROI: ${result2.businessValue.roi}`);
    console.log(`   UX: ${result2.userExperience.sentiment}`);

    if (result2.redFlags[0] !== "None identified") {
        console.log("\n🚩 RED FLAGS:");
        result2.redFlags.forEach(flag => console.log(`   - ${flag}`));
    }

    // Comparison Summary
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 COMPARISON SUMMARY");
    console.log("=".repeat(80));

    console.log("\n| Dimension              | VM #1 (Email Status) | VM #2 (Social Media) |");
    console.log("|------------------------|---------------------|---------------------|");
    console.log(`| Strategic Alignment    | ${result1.strategicAlignment.score}/100              | ${result2.strategicAlignment.score}/100              |`);
    console.log(`| Business Value         | ${result1.businessValue.score}/100              | ${result2.businessValue.score}/100               |`);
    console.log(`| User Experience        | ${result1.userExperience.score}/100              | ${result2.userExperience.score}/100               |`);
    console.log(`| Absolute Gain          | ${result1.businessValue.absoluteGain} users          | ${result2.businessValue.absoluteGain} users           |`);
    console.log(`| ROI                    | ${result1.businessValue.roi}            | ${result2.businessValue.roi}                |`);

    console.log("\n🎯 VERDICT:");
    const avg1 = Math.round((result1.strategicAlignment.score + result1.businessValue.score + result1.userExperience.score) / 3);
    const avg2 = Math.round((result2.strategicAlignment.score + result2.businessValue.score + result2.userExperience.score) / 3);

    console.log(`   VM #1 Average: ${avg1}/100 - ${avg1 >= 70 ? '✅ RECOMMENDED' : avg1 >= 50 ? '⚠️ NEEDS IMPROVEMENT' : '❌ NOT RECOMMENDED'}`);
    console.log(`   VM #2 Average: ${avg2}/100 - ${avg2 >= 70 ? '✅ RECOMMENDED' : avg2 >= 50 ? '⚠️ NEEDS IMPROVEMENT' : '❌ NOT RECOMMENDED'}`);

    console.log("\n" + "=".repeat(80));
}

runComparison().catch(err => console.error("Error:", err));
