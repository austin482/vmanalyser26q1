import { generateWeeklyAnnouncement } from '../src/services/larkAnnouncementService.js';

async function test() {
    try {
        // You can specify a week token like 'W05' if needed
        const result = await generateWeeklyAnnouncement();
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
