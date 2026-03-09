import { analyzeComprehensive } from './src/services/analyzer.js';
import { fetchVMsFromLark } from './src/services/larkBitableService.js';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const db = new Database('./austina.db');
const okrs = db.prepare('SELECT * FROM okrs').all().map(o => ({
    ...o,
    keyResults: JSON.parse(o.keyResults)
}));
db.close();

global.localStorage = {
    getItem: (key) => key === 'austina_okrs' ? JSON.stringify(okrs) : null
};

async function debugAll() {
    const vms = await fetchVMsFromLark();
    console.log(`Found ${vms.length} total VMs`);

    for (const vm of vms) {
        const metricNameRaw = vm.fields['Metric Name'];
        const metricName = Array.isArray(metricNameRaw)
            ? metricNameRaw.map(item => item.text || item).join(' ')
            : (metricNameRaw?.text || metricNameRaw || 'Unknown');

        const picBURaw = vm.fields['PIC BU'];
        let buNames = [];
        if (Array.isArray(picBURaw)) {
            buNames = picBURaw.map(bu => bu?.text || String(bu));
        } else {
            buNames = [picBURaw?.text || String(picBURaw)];
        }

        // Clean up like server.js
        buNames = buNames.map(name => {
            let cleaned = name.trim();
            if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
                cleaned = cleaned.slice(1, -1).trim();
            }
            return cleaned;
        });

        const currentScore = vm.fields['Austina Score'];

        // Let's re-analyze the ones that got low scores
        if (currentScore < 40) {
            console.log(`\n🔍 VM: ${metricName} (Current Lark Score: ${currentScore})`);
            console.log(`   Cleaned BUs: ${buNames.join(', ')}`);

            for (const bu of buNames) {
                console.log(`   → Re-analyzing against "${bu}"...`);
                const analysis = await analyzeComprehensive({
                    metricName,
                    description: vm.fields['Description'] || '',
                    bu: bu
                }, bu);
                console.log(`   → NEW Score for ${bu}: ${analysis.strategic_alignment.score}`);
                console.log(`   → Insights: ${analysis.overall_insights[0]}`);
            }
        }
    }
}

debugAll();
