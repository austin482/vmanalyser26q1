// Simple test for multi-BU parser
const testDocument = `
2026 Q1

BU Name: JS Product - Application
Objective: Improve User Engagement

KR 1: Increase active users
- Daily active users
- Monthly active users

KR 2: Improve conversion rate
- Application completion rate

BU Name: Marketing
Objective: Expand Market Reach

KR 1: Increase brand awareness
- Social media impressions
- Website traffic

BU Name: My Talent Pool
Objective: Enhance Recruiter Tools

KR 1: Improve candidate engagement
- Candidate response rate
`;

// Inline parser function (copy of the updated version)
function parseLarkDocumentToOKR(content) {
    console.log('📄 Parsing document...\n');

    const lines = content.split('\n');
    const okrs = [];
    let currentOKR = null;
    let currentKR = null;
    let globalQuarter = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Extract global quarter
        const quarterMatch = line.match(/Q[1-4]\s*\d{4}|\d{4}\s*Q[1-4]/i);
        if (quarterMatch && !currentOKR) {
            globalQuarter = quarterMatch[0];
            console.log('✅ Found global quarter:', globalQuarter);
            continue;
        }

        // Detect BU boundary
        const buMatch = line.match(/(?:BU\s*Name|Business\s*Unit)\s*[：:]\s*(.+)/i);
        if (buMatch) {
            if (currentOKR && currentOKR.buName) {
                okrs.push(currentOKR);
                console.log('💾 Saved OKR for BU:', currentOKR.buName, '\n');
            }

            currentOKR = {
                quarter: globalQuarter,
                buName: buMatch[1].trim(),
                objective: '',
                keyResults: []
            };
            currentKR = null;
            console.log('✅ Found new BU:', currentOKR.buName);
            continue;
        }

        if (!currentOKR) {
            currentOKR = {
                quarter: globalQuarter,
                buName: '',
                objective: '',
                keyResults: []
            };
        }

        // Extract Objective
        const objMatch = line.match(/(?:Objective|OKR)\s*[：:]\s*(.+)/i);
        if (objMatch && currentOKR) {
            currentOKR.objective = objMatch[1].trim();
            console.log('  ✅ Objective:', currentOKR.objective);
            continue;
        }

        // Extract Key Results
        const krMatch = line.match(/^KR\s*(\d+\.?\d*)\s*[：:]?\s*(.*)$/i);
        if (krMatch && currentOKR) {
            const krNumber = krMatch[1];
            const krDescription = krMatch[2] || '';

            currentKR = {
                id: `kr${currentOKR.keyResults.length + 1}`,
                category: krDescription.trim() || `Key Result ${krNumber}`,
                metrics: [],
                ratio: '50%'
            };
            currentOKR.keyResults.push(currentKR);
            console.log('  ✅ KR:', currentKR.category);
            continue;
        }

        // Extract metrics
        if (currentKR && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))) {
            const metric = line.replace(/^[-•*]\s*/, '').trim();
            if (metric) {
                currentKR.metrics.push(metric);
                console.log('    - Metric:', metric);
            }
        }
    }

    // Save the last OKR
    if (currentOKR && currentOKR.buName) {
        okrs.push(currentOKR);
        console.log('💾 Saved final OKR for BU:', currentOKR.buName);
    }

    return okrs;
}

console.log('🧪 Testing Multi-BU Parser');
console.log('='.repeat(60), '\n');

const result = parseLarkDocumentToOKR(testDocument);

console.log('\n📊 FINAL RESULTS:');
console.log('='.repeat(60));
console.log(`Total OKRs parsed: ${result.length}\n`);

result.forEach((okr, index) => {
    console.log(`OKR #${index + 1}:`);
    console.log(`  Quarter: ${okr.quarter}`);
    console.log(`  BU Name: ${okr.buName}`);
    console.log(`  Objective: ${okr.objective}`);
    console.log(`  Key Results: ${okr.keyResults.length}`);
    okr.keyResults.forEach((kr, krIndex) => {
        console.log(`    KR ${krIndex + 1}: ${kr.category}`);
        console.log(`      Metrics: ${kr.metrics.join(', ')}`);
    });
    console.log('');
});

console.log('='.repeat(60));
console.log('✅ Test complete!');
