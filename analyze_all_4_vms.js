// Batch Analysis - ALL 4 VMs
import { analyzeComprehensive } from './src/services/analyzer.js';
import { makeDecision, decisionToTOML } from './src/services/decisionMaker.js';

const vmsToAnalyze = [
    {
        name: "Increase number of profile update",
        data: {
            metricName: "Increase number of profile update",
            description: "Increase number of profile update from web notification",
            baselineRate: "8",
            targetRate: "10.4",
            minVolume: "5000",
            bu: "JS Product",
            selectedOKR: "okr-001-kr-001",
            okrRationale: "Increase number of profile update from web notification"
        },
        okr: {
            id: "okr-001",
            quarter: "2025 Q1",
            buName: "JS Product",
            objective: "Happy Jobseeker Using MKRB",
            keyResults: [{
                id: "kr-001",
                category: "Positive Result",
                metrics: ["Profile completion rate", "Job application success rate"]
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
    },
    {
        name: "Increase Number Of Saved Candidates In Candidate Search",
        data: {
            metricName: "Increase Number Of Saved Candidates In Candidate Search",
            description: "Improve the candidate search experience for employers by making it easier to save promising candidates for later review",
            baselineRate: "10",
            targetRate: "15",
            minVolume: "3000",
            bu: "My Talent Pool",
            selectedOKR: "okr-1733882756494-kr-001",
            okrRationale: "Saving candidates is a key indicator of employer engagement"
        },
        okr: {
            id: "okr-1733882756494",
            quarter: "2025 Q4",
            buName: "My Talent Pool",
            objective: "Happy Employer using AJT Product",
            keyResults: [{
                id: "kr-001",
                category: "Positive Result",
                metrics: ["Number of jobseeker profiles being saved"]
            }]
        }
    },
    {
        name: "Update Applied Job Status from Email",
        data: {
            metricName: "Update Applied Job Status from Email",
            description: "Automatically update job application status when employers send status update emails",
            baselineRate: "5",
            targetRate: "10",
            minVolume: "2500",
            bu: "JS Product",
            selectedOKR: "okr-001-kr-001",
            okrRationale: "Helps jobseekers track applications"
        },
        okr: {
            id: "okr-001",
            quarter: "2025 Q1",
            buName: "JS Product",
            objective: "Happy Jobseeker Using MKRB",
            keyResults: [{
                id: "kr-001",
                category: "Usage",
                metrics: ["Job application tracking", "User engagement"]
            }]
        }
    }
];

console.log("🔍 COMPLETE BATCH ANALYSIS - All 4 VMs");
console.log("=".repeat(80));

async function analyzeAll4VMs() {
    const results = [];

    for (let i = 0; i < vmsToAnalyze.length; i++) {
        const vm = vmsToAnalyze[i];
        console.log(`\n${"=".repeat(80)}`);
        console.log(`📋 VM ${i + 1}/4: ${vm.name}`);
        console.log("─".repeat(80));

        const analyzerReport = await analyzeComprehensive(vm.data, vm.okr);
        const decision = makeDecision(analyzerReport, vm.data);

        results.push({
            vm: vm.name,
            analyzer: analyzerReport,
            decision: decision
        });

        console.log(`📊 Scores: Strategic ${analyzerReport.strategic_alignment.score} | Business ${analyzerReport.business_value.score} | UX ${analyzerReport.user_experience.score}`);
        console.log(`🎯 Verdict: ${decision.decision.verdict} | Final: ${decision.decision.final_score}/100 | Priority: ${decision.decision.priority}`);
        console.log(`💰 Impact: ${analyzerReport.business_value.absolute_gain} users`);
    }

    // Summary table
    console.log(`\n\n${"=".repeat(80)}`);
    console.log("📊 COMPLETE SUMMARY TABLE");
    console.log("=".repeat(80));
    console.log("\n| # | VM Name | Score | Verdict | Priority | Impact |");
    console.log("|---|---------|-------|---------|----------|--------|");

    results.forEach((r, i) => {
        const num = String(i + 1).padStart(1);
        const name = r.vm.substring(0, 35).padEnd(35);
        const score = String(r.decision.decision.final_score).padStart(2);
        const verdict = r.decision.decision.verdict.substring(0, 20).padEnd(20);
        const priority = r.decision.decision.priority.padEnd(8);
        const impact = `${r.analyzer.business_value.absolute_gain}`.padStart(4);
        console.log(`| ${num} | ${name} | ${score}/100 | ${verdict} | ${priority} | ${impact} users |`);
    });

    console.log("\n" + "=".repeat(80));
    return results;
}

analyzeAll4VMs().catch(err => console.error("Error:", err));
