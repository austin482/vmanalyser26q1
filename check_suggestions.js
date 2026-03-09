import { fetchVMsFromLark } from './src/services/larkBitableService.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const vms = await fetchVMsFromLark();
    const targets = [
        '[BRAND NEW Q1] Improve Bulk Apply Job Card in Onboarding Thank You Page',
        '[BRAND NEW Q1] Increase Walk In Interested Signal'
    ];

    vms.forEach(vm => {
        const nameRaw = vm.fields['Metric Name'];
        const name = Array.isArray(nameRaw) ? nameRaw.map(i => i.text).join('') : (nameRaw?.text || nameRaw || 'Unknown');
        if (targets.some(t => name.includes(t))) {
            console.log(`\n--- ${name} ---`);
            console.log(`Score: ${vm.fields['Austina Score']}`);
            console.log(`Suggestion: ${vm.fields['AI Suggestion']}`);
        }
    });
}
check();
