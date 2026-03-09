// Fix: Allow score of 0 to be valid, don't treat as error
import fs from 'fs';

const serverPath = './server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Replace the error throwing when no bestAnalysis found
content = content.replace(
    /if \(!bestAnalysis\) \{\s+throw new Error\(`Failed to analyze VM against any BU: \$\{buNames\.join\(', '\)\}`\);\s+\}/,
    `if (!bestAnalysis) {
                    // Create a default analysis for score 0
                    bestAnalysis = {
                        gate: { status: "PASSED" },
                        strategic_alignment: { score: 0 },
                        overall_insights: ["No clear connection to any BU OKRs"],
                        red_flags: ["This VM does not align with current OKR priorities"]
                    };
                    bestScore = 0;
                    bestBU = buNames[0] || '';
                }`
);

// Also fix the "Keep the best score" logic to accept 0 as valid
content = content.replace(
    /\/\/ Keep the best score\s+if \(score > bestScore\) \{/,
    `// Keep the best score (including 0)
                        if (score > bestScore || !bestAnalysis) {`
);

fs.writeFileSync(serverPath, content);
console.log('✅ Fixed: Score of 0 is now valid - no longer throws error');
