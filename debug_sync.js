import { analyzeComprehensive } from './src/services/analyzer.js';
import { fetchPendingVMs } from './src/services/larkBitableService.js';
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

async function debugSync() {
    const vms = await fetchPendingVMs();
    console.log(`Found ${vms.length} pending VMs`);

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

        console.log(`\n🔍 VM: ${metricName}`);
        console.log(`   Lark BUs: ${JSON.stringify(picBURaw)}`);
        console.log(`   Cleaned BUs: ${buNames.join(', ')}`);

        for (const bu of buNames) {
            console.log(`   → Matching "${bu}" against DB...`);
            const analysis = await analyzeComprehensive({
                metricName,
                description: '',
                bu: bu
            }, bu);
            console.log(`   → Result for ${bu}: Score ${analysis.strategic_alignment.score}`);
            if (analysis.strategic_alignment.score === 0) {
                console.log(`   ❌ REASON: ${analysis.overall_insights[0]}`);
            }
        }
    }
}

debugSync();
