// Test script for analyzer diversity
import { analyzeComprehensive } from './src/services/analyzer.js';

// Mock localStorage for Node
global.localStorage = {
    getItem: (key) => {
        if (key === 'austina_okrs') {
            return JSON.stringify([
                {
                    id: 'okr-1',
                    buName: 'Mobile App',
                    quarter: '2024-Q1',
                    objective: 'Increase user engagement',
                    keyResults: [
                        { id: 'kr-1', category: 'usage', metrics: ['Number of 2-way chats'] },
                        { id: 'kr-2', category: 'usage', metrics: ['Active users'] }
                    ]
                }
            ]);
        }
        return null;
    }
};

async function test() {
    const vms = [
        { name: 'Fix chat bug', desc: 'Fixes a minor UI bug in chat' },
        { name: 'New chat reactions', desc: 'Allows users to react to messages with emojis, increasing engagement' },
        { name: 'Chat overhaul', desc: 'Complete redesign of chat for better usability' }
    ];

    for (const vm of vms) {
        console.log(`\n🔍 Testing: ${vm.name}`);
        try {
            const analysis = await analyzeComprehensive({
                metricName: vm.name,
                description: vm.desc,
                bu: 'Mobile App',
                okrRationale: vm.desc,
                selectedOKR: null
            }, 'Mobile App');
            console.log(`✅ Score: ${analysis.strategic_alignment.score}`);
        } catch (e) {
            console.error(`❌ Error: ${e.message}`);
        }
    }
}

test();
