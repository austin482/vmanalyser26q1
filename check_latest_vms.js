import Database from 'better-sqlite3';

const db = new Database('austina.db');

try {
    const vms = db.prepare('SELECT id, metricName, bu, status, strategicCompassAnalysis, decisionMakerAnalysis, createdAt FROM vms ORDER BY createdAt DESC LIMIT 5').all();
    console.log('Latest 5 VMs:');
    vms.forEach(vm => {
        console.log(`ID: ${vm.id}`);
        console.log(`Metric Name: ${vm.metricName}`);
        console.log(`BU: ${vm.bu}`);
        console.log(`Status: ${vm.status}`);
        console.log(`Strategic Compass: ${vm.strategicCompassAnalysis ? 'Exists (' + vm.strategicCompassAnalysis.length + ')' : 'None'}`);
        console.log(`Decision Maker: ${vm.decisionMakerAnalysis ? 'Exists (' + vm.decisionMakerAnalysis.length + ')' : 'None'}`);
        console.log(`Created At: ${vm.createdAt}`);
        console.log('---');
    });
} catch (error) {
    console.error('Error reading database:', error);
} finally {
    db.close();
}
