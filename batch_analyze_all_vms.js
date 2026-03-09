// Batch Analysis - Analyze ALL VMs in the system
import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision, decisionToTOML } from './src/services/decisionMaker.js';

// Based on what we know exists in the system
const vmsToAnalyze = [
    {
        name: "Increase number of profile update",
        data: {
            metricName: "Increase number of profile update",
            description: "Encourage jobseekers to update their profiles by showing a progress bar and offering profile completion rewards",
            baselineRate: "30",
            targetRate: "45",
            minVolume: "8000",
            bu: "JS Product",
            selectedOKR: "okr-001-kr-001",
            okrRationale: "Profile updates directly improve engagement metrics"
        },
        okr: {
            id: "okr-001",
            quarter: "2025 Q1",
            buName: "JS Product",
            objective: "Happy Jobseeker Using MKRB",
            keyResults: [{
                id: "kr-001",
                category: "Usage",
                metrics: ["Profile completion rate", "Job application submission rate"]
            }]
        }
    },
    {
        name: "Increase My Folder Adoption within Candidate Search",
        data: {
            metricName: "Increase My Folder Adoption within Candidate Search",
            description: "Increase employer adoption of My Folder as a core hiring workflow inside Candidate Search",
            baselineRate: "22.02",
            targetRate: "27.02",
            minVolume: "480",
            bu: "My Talent Pool",
            selectedOKR: "okr-1733882756494-kr-002",
            okrRationale: "Increase employer adoption of My Folder as a core hiring workflow inside Candidate Search"
        },
        okr: {
            id: "okr-1733882756494",
            quarter: "2025 Q4",
            buName: "My Talent Pool",
            objective: "Happy Employer using AJT Product",
            keyResults: [{
                id: "kr-002",
                category: "Usage",
                metrics: ["Number of employers opt-in to My Talent Pool", "Number of active employers"]
            }]
        }
    }
];

console.log("🔍 BATCH ANALYSIS - All VMs");
console.log("=".repeat(80));
console.log(`\nAnalyzing ${vmsToAnalyze.length} VMs...\n`);

async function analyzeAllVMs() {
    const results = [];

    for (let i = 0; i < vmsToAnalyze.length; i++) {
        const vm = vmsToAnalyze[i];
        console.log(`\n${"=".repeat(80)}`);
        console.log(`📋 VM ${i + 1}/${vmsToAnalyze.length}: ${vm.name}`);
        console.log("─".repeat(80));

        // Run analysis
        const analyzerReport = await analyzeComprehensive(vm.data, vm.okr);
        const decision = makeDecision(analyzerReport, vm.data);

        // Store result
        results.push({
            vm: vm.name,
            analyzer: analyzerReport,
            decision: decision
        });

        // Display summary
        console.log(`\n📊 Scores:`);
        console.log(`   Strategic: ${analyzerReport.strategic_alignment.score}/100`);
        console.log(`   Business: ${analyzerReport.business_value.score}/100`);
        console.log(`   UX: ${analyzerReport.user_experience.score}/100`);
        console.log(`\n🎯 Decision:`);
        console.log(`   Verdict: ${decision.decision.verdict}`);
        console.log(`   Final Score: ${decision.decision.final_score}/100`);
        console.log(`   Priority: ${decision.decision.priority}`);
        console.log(`   Impact: ${analyzerReport.business_value.absolute_gain} users`);
    }

    // Summary table
    console.log(`\n\n${"=".repeat(80)}`);
    console.log("📊 SUMMARY TABLE");
    console.log("=".repeat(80));
    console.log("\n| VM Name | Final Score | Verdict | Priority | Impact |");
    console.log("|---------|-------------|---------|----------|--------|");

    results.forEach(r => {
        const name = r.vm.substring(0, 30).padEnd(30);
        const score = String(r.decision.decision.final_score).padEnd(3);
        const verdict = r.decision.decision.verdict.padEnd(25);
        const priority = r.decision.decision.priority.padEnd(8);
        const impact = `${r.analyzer.business_value.absolute_gain} users`.padEnd(10);
        console.log(`| ${name} | ${score}/100 | ${verdict} | ${priority} | ${impact} |`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("✅ Analysis complete!");
    console.log("=".repeat(80));

    return results;
}

analyzeAllVMs().catch(err => console.error("Error:", err));
