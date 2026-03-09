// Decision Maker Agent - Final Verdict & Priority Assignment
// Output Format: TOML

/**
 * Makes final GO/NO-GO decision based on Analyzer report
 * @param {Object} analyzerReport - The comprehensive analysis from Analyzer agent
 * @param {Object} vmData - The original VM data
 * @returns {Object} Final decision in TOML-compatible format
 */
export function makeDecision(analyzerReport, vmData) {
    // If gate failed, immediate rejection
    if (analyzerReport.gate.status === "FAILED") {
        return {
            decision: {
                verdict: "REJECTED",
                priority: "None",
                final_score: 0,
                confidence: "High"
            },
            score_breakdown: {
                strategic_alignment: 0,
                business_value: 0,
                user_experience: 0,
                weighted_calculation: "(0 × 0.4) + (0 × 0.4) + (0 × 0.2) = 0"
            },
            reasoning: {
                summary: analyzerReport.gate.reason,
                key_issue: analyzerReport.gate.failed_gate,
                strengths: ["None identified"],
                concerns: [analyzerReport.gate.reason]
            },
            conditions: [],
            next_steps: ["Reassign to correct team"],
            metadata: {
                timestamp: new Date().toISOString(),
                agent: "Decision Maker"
            }
        };
    }

    // Calculate final score - 100% strategic alignment (business metrics removed)
    const finalScore = analyzerReport.strategic_alignment.score;

    // Determine verdict based on score and red flags
    let verdict, priority, confidence;
    const conditions = [];
    const nextSteps = [];

    const hasRedFlags = analyzerReport.red_flags.some(flag => flag !== "None identified");
    const absoluteGain = analyzerReport.business_value.absolute_gain;
    const strategicScore = analyzerReport.strategic_alignment.score;

    // Decision logic (lowered thresholds to be more generous)
    if (finalScore >= 70 && !hasRedFlags) {  // Lowered from 80
        verdict = "APPROVED";
        priority = "High";
        confidence = "High";
        nextSteps.push("Prioritize for next sprint");
        nextSteps.push("Allocate engineering resources");
    } else if (finalScore >= 60 && absoluteGain >= 500) {  // Lowered from 70
        verdict = "APPROVED";
        priority = "Medium";
        confidence = "Moderate";
        nextSteps.push("Schedule for upcoming quarter");
        if (hasRedFlags) {
            conditions.push("Address red flags before implementation");
        }
    } else if (finalScore >= 50) {  // Lowered from 60
        verdict = "APPROVED_WITH_CONDITIONS";
        priority = "Medium";
        confidence = "Moderate";

        // Add specific conditions based on weaknesses
        if (absoluteGain < 200) {
            conditions.push("Bundle with other improvements for bigger impact");
        }
        if (strategicScore < 70) {
            conditions.push("Strengthen OKR alignment rationale");
        }
        if (hasRedFlags) {
            conditions.push("Resolve: " + analyzerReport.red_flags.find(f => f !== "None identified"));
        }

        nextSteps.push("Refine proposal based on conditions");
        nextSteps.push("Re-submit for approval after improvements");
    } else if (finalScore >= 50) {
        verdict = "NEEDS_IMPROVEMENT";
        priority = "Low";
        confidence = "Low";
        conditions.push("Significant improvements required");
        nextSteps.push("Revise VM proposal");
        nextSteps.push("Consider alternative approaches");
    } else {
        verdict = "REJECTED";
        priority = "None";
        confidence = "High";
        nextSteps.push("Do not proceed with this VM");
        nextSteps.push("Focus on higher-value opportunities");
    }

    // Generate reasoning summary
    let summary = "";
    if (verdict === "APPROVED") {
        summary = `Strong VM with ${finalScore}/100 score. Good alignment across strategic, business, and UX dimensions.`;
    } else if (verdict === "APPROVED_WITH_CONDITIONS") {
        summary = `Decent VM (${finalScore}/100) but needs improvements. ${conditions.length} condition(s) must be addressed before proceeding.`;
    } else if (verdict === "NEEDS_IMPROVEMENT") {
        summary = `Weak VM (${finalScore}/100). Requires significant refinement to justify development effort.`;
    } else {
        summary = `Not viable (${finalScore}/100). Does not meet minimum standards for approval.`;
    }

    return {
        decision: {
            verdict,
            priority,
            final_score: finalScore,
            confidence
        },
        score_breakdown: {
            strategic_alignment: analyzerReport.strategic_alignment.score,
            business_value: analyzerReport.business_value.score,
            user_experience: 0,  // UX removed from scoring
            weighted_calculation: `Strategic Alignment: ${finalScore} (100% weight)`
        },
        reasoning: {
            summary,
            strengths: generateStrengths(analyzerReport),
            concerns: generateConcerns(analyzerReport)
        },
        conditions: conditions.length > 0 ? conditions : ["None"],
        next_steps: nextSteps,
        metadata: {
            timestamp: new Date().toISOString(),
            agent: "Decision Maker"
        }
    };
}

function generateStrengths(report) {
    const strengths = [];

    if (report.strategic_alignment.score >= 80) {
        strengths.push("Strong strategic alignment with BU and OKR");
    }
    if (report.business_value.score >= 80) {
        strengths.push("High business value and ROI");
    }
    if (report.user_experience.score >= 80) {
        strengths.push("Positive user experience impact");
    }
    if (report.business_value.absolute_gain >= 1000) {
        strengths.push(`Large scale impact (${report.business_value.absolute_gain}+ users)`);
    }

    return strengths.length > 0 ? strengths : ["None identified"];
}

function generateConcerns(report) {
    const concerns = [];

    if (report.strategic_alignment.score < 60) {
        concerns.push("Weak strategic alignment - unclear OKR contribution");
    }
    if (report.business_value.score < 60) {
        concerns.push("Limited business value - small impact");
    }
    if (report.business_value.absolute_gain < 200) {
        concerns.push(`Low scale (only ${report.business_value.absolute_gain} users affected)`);
    }
    if (report.red_flags.some(f => f !== "None identified")) {
        concerns.push("Critical issues flagged by analyzer");
    }

    return concerns.length > 0 ? concerns : ["None identified"];
}

/**
 * Convert decision to TOML string format
 */
export function decisionToTOML(decision) {
    let toml = '';

    // Decision section
    toml += '[decision]\n';
    toml += `verdict = "${decision.decision.verdict}"\n`;
    toml += `priority = "${decision.decision.priority}"\n`;
    toml += `final_score = ${decision.decision.final_score}\n`;
    toml += `confidence = "${decision.decision.confidence}"\n\n`;

    // Score breakdown
    toml += '[score_breakdown]\n';
    toml += `strategic_alignment = ${decision.score_breakdown.strategic_alignment}\n`;
    toml += `business_value = ${decision.score_breakdown.business_value}\n`;
    toml += `user_experience = ${decision.score_breakdown.user_experience}\n`;
    toml += `weighted_calculation = "${decision.score_breakdown.weighted_calculation}"\n\n`;

    // Reasoning
    toml += '[reasoning]\n';
    toml += `summary = "${decision.reasoning.summary}"\n\n`;

    // Strengths
    decision.reasoning.strengths.forEach(strength => {
        toml += '[[reasoning.strengths]]\n';
        toml += `strength = "${strength}"\n\n`;
    });

    // Concerns
    decision.reasoning.concerns.forEach(concern => {
        toml += '[[reasoning.concerns]]\n';
        toml += `concern = "${concern}"\n\n`;
    });

    // Conditions
    decision.conditions.forEach(condition => {
        toml += '[[conditions]]\n';
        toml += `condition = "${condition}"\n\n`;
    });

    // Next steps
    decision.next_steps.forEach(step => {
        toml += '[[next_steps]]\n';
        toml += `step = "${step}"\n\n`;
    });

    // Metadata
    toml += '[metadata]\n';
    toml += `timestamp = "${decision.metadata.timestamp}"\n`;
    toml += `agent = "${decision.metadata.agent}"\n`;

    return toml;
}
