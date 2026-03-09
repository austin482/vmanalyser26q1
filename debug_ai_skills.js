import { analyzeComprehensive } from './src/services/analyzer.js';
import Database from 'better-sqlite3';

// Mock localStorage
const db = new Database('./austina.db');
const okrs = db.prepare('SELECT * FROM okrs').all().map(o => ({
    ...o,
    keyResults: JSON.parse(o.keyResults)
}));
db.close();

global.localStorage = {
    getItem: (key) => key === 'austina_okrs' ? JSON.stringify(okrs) : null
};

async function test() {
    const vm = {
        metricName: '[BRAND NEW Q1] Add AI Skillks in Skills & Language Section',
        description: 'Allow users to add AI related skills',
        bu: 'JS Product - Profile',
        okrRationale: 'Directly impacts KR for AI Skills'
    };

    console.log(`🔍 Testing: ${vm.metricName}`);
    const analysis = await analyzeComprehensive(vm, 'JS Product - Profile');
    console.log(JSON.stringify(analysis, null, 2));
}

test();
