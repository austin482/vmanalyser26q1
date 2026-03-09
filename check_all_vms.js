import { fetchVMsFromLark } from './src/services/larkBitableService.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const vms = await fetchVMsFromLark();
    console.log(`Found ${vms.length} total VMs`);
    vms.forEach(vm => {
        const nameRaw = vm.fields['Metric Name'];
        const name = Array.isArray(nameRaw) ? nameRaw.map(i => i.text).join('') : (nameRaw?.text || nameRaw || 'Unknown');
        const statusRaw = vm.fields['Status'];
        const status = statusRaw?.text || statusRaw || 'Unknown';
        console.log(`- ${name}: Status = ${status}, Score = ${vm.fields['Austina Score']}`);
    });
}
check();
