// Further refine prompts to increase score diversity and move away from 75 as a default
import fs from 'fs';

const analyzerPath = './src/services/analyzer.js';
let content = fs.readFileSync(analyzerPath, 'utf8');

// 1. Update analyzeBUWide prompt - even more emphasis on diversity
content = content.replace(
    /CRITICAL SCORING RULES:[\s\S]*?- Poor \(0\): VM has NO clear connection to any KR - default to 0 if unrelated\s*\*\*Typical related VMs should fall in the 50-75 range\.\*\* Only truly top-tier VMs score 80\+\./,
    `CRITICAL SCORING RULES:
- **Check VM-KR relevance FIRST** - If VM has no clear connection to any KR, score = 0 (exactly 0).
- **AVOID CLUSTERING**: Do not default to "standard" scores like 70, 75, or 80.
- **DEPTH OF ALIGNMENT**: Use the full 0-100 scale. If alignment is good but not perfect, a score like 63, 67, or 71 is more realistic than 75.
- Be precise: Differentiate between a "Great" VM (80s), a "Good" VM (60s-70s), and a "Fair" VM (40s-50s).

Scoring Guidelines:
- Exceptional (85-100): Direct KR measurement + exhaustive data
- Strong (70-84): Clear impact + solid logic + good rationale
- Good (50-69): Reasonable contribution + logic holds up
- Fair/Moderate (30-49): Tangential connection or weak rationale
- Minimal (1-29): Very loose connection
- None (0): Completely unrelated`
);

// 2. Update getAIAnalyzerReport prompt - same diversity focus
content = content.replace(
    /CRITICAL SCORING RULES:[\s\S]*?- Poor \(0\): VM has NO clear connection to any KR - default to 0 if unrelated\s*\*\*Typical related VMs should fall in the 50-75 range\.\*\* Only truly top-tier VMs score 80\+\./,
    `CRITICAL SCORING RULES:
- **AVOID CLUSTERING**: Do not default to "standard" scores like 70, 75, or 80.
- **BE GRANULAR**: Use specific numbers (e.g., 64, 77, 82) rather than rounding to the nearest 5.
- **CONTINUOUS SCALE**: Use the full 0-100 range to reflect the true quality of the alignment and rationale.

Scoring Guidelines:
- Exceptional (85-100): Direct KR measurement + exhaustive data
- Strong (70-84): Clear impact + solid logic + good rationale
- Good (50-69): Reasonable contribution + logic holds up
- Fair/Moderate (30-49): Tangential connection or weak rationale
- Minimal (1-29): Very loose connection
- None (0): Completely unrelated`
);

fs.writeFileSync(analyzerPath, content);
console.log('✅ Prompts refined for maximum score diversity. Removed "75" end-caps and added granularity instructions.');
