import { fetchPendingVMs } from './src/services/larkBitableService.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const vms = await fetchPendingVMs();
    console.log(`Found ${vms.length} pending VMs`);
    vms.forEach(vm => {
        console.log(`- ${vm.fields['Metric Name']}: BU = ${JSON.stringify(vm.fields['PIC BU'])}`);
    });
}
check();
