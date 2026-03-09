import { fetchVMsFromLark, getTableSchema } from './src/services/larkBitableService.js';

async function debug() {
    try {
        console.log('Fetching schema...');
        const schema = await getTableSchema();
        console.log('Fields:', schema.map(f => f.field_name));

        const weekField = schema.find(f => f.field_name === 'Week');
        if (weekField) {
            console.log('Week Field:', JSON.stringify(weekField, null, 2));
        }

        console.log('\nFetching some records...');
        const vms = await fetchVMsFromLark();
        if (vms.length > 0) {
            console.log('First record fields:', Object.keys(vms[0].fields));
            console.log('Sample record:', JSON.stringify(vms[0].fields, null, 2));
        } else {
            console.log('No records found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

debug();
