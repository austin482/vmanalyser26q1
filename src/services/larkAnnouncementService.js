import { fetchRecordsFromTable, getTenantAccessToken } from './larkBitableService.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

const RESULTS_TABLE_ID = 'tblzHjByjzN5GJhe'; // Q1 VM Result (Per Weekly)
const WEEK_TABLE_ID = 'tblKTVhTEzayUiLj';   // 2026 Week Date
const LARK_CHAT_ID = process.env.LARK_CHAT_ID;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const LARK_API_BASE = 'https://open.larksuite.com/open-apis';

/**
 * Call AI to generate a creative announcement
 */
async function aiGenerateAnnouncement(leaderboard, weekToken) {
    if (!OPENROUTER_API_KEY) {
        console.warn('⚠️ No AI API Key found. Skipping AI generation.');
        return null;
    }

    try {
        console.log('🤖 Asking AI to generate announcement...');

        const leaderboardText = leaderboard
            .map((item, index) => `${index + 1}. ${item.employee}: ${item.totalVM} VMs`)
            .join('\n');

        const prompt = `You are a strategic internal communications specialist for Austina.
Your voice is professional, motivating, and results-oriented.

Task: Create a weekly Value Metrics (VM) leaderboard announcement for our Lark group.
Week: ${weekToken}

Data:
${leaderboardText}

Structure:
1. 🏆 A clear, bold title celebrating the week's achievements.
2. 🥇 An "MVP" section highlighting the top performer (Rank 1) by name and VM count. Add a brief, specific word of encouragement for them.
3. 🥈🥉 A "Top Contenders" section listing the rest of the top 3-5 performers.
4. 🚀 An inspiring closing statement that encourages everyone to contribute and stay aligned with their OKRs.

Style Rules:
- Use localized/appropriate emojis (🏆, 🥇, 🥈, 🥉, 🚀).
- Keep it concise (max 250 words) to ensure it's easily readable on mobile.
- Focus strictly on the Employee Name and Total VM counts.
- Mention "Austina" as the company.

Output the final message in plain text.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://austina.app',
                'X-Title': 'Austina Announcement Generator'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.8
            })
        });

        const data = await response.json();
        return data.choices[0]?.message?.content || null;

    } catch (error) {
        console.error('❌ AI generation failed:', error);
        return null;
    }
}

/**
 * Get the current week token (e.g., "W06") based on today's date
 */
export async function getCurrentWeekToken() {
    try {
        console.log('📅 Detecting current week...');
        const now = Date.now();
        const weeks = await fetchRecordsFromTable(WEEK_TABLE_ID);

        const currentYear = new Date().getFullYear().toString();

        const currentWeek = weeks.find(r => {
            const start = r.fields['Week Start Date'];
            const end = r.fields['Week End Date'];
            const year = r.fields['Year'];
            return now >= start && now <= end && year === currentYear;
        });

        if (currentWeek) {
            const token = currentWeek.fields.Week;
            console.log(`✅ Current week detected: ${token}`);
            return token;
        }

        console.warn('⚠️ Could not find current week in table for this year. Falling back to latest available Wxx.');
        const yearWeeks = weeks.filter(r => r.fields.Year === currentYear);
        const sourceWeeks = yearWeeks.length > 0 ? yearWeeks : weeks;

        sourceWeeks.sort((a, b) => b.fields['Week Start Date'] - a.fields['Week Start Date']);
        return sourceWeeks[0]?.fields.Week || 'W01';

    } catch (error) {
        console.error('❌ Error detecting current week:', error);
        return 'W01';
    }
}

/**
 * Format the announcement message as an Employee Leaderboard
 */
export function formatAnnouncementMessage(leaderboard, weekToken) {
    const messageTitle = `🏆 Weekly Employee VM Leaderboard - ${weekToken}`;
    let messageText = `Here is the leaderboard for most active Value Metrics this week:\n\n`;

    leaderboard.forEach((item, index) => {
        const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `${index + 1}.`));
        messageText += `${medal} *${item.employee}*\n`;
        messageText += `   Total VMs: ${item.totalVM}\n\n`;
    });

    messageText += `Great work on the submissions! Keep it up! 🚀`;

    return { title: messageTitle, text: messageText };
}

/**
 * Generate weekly announcement based on Employee TotalVMs
 * @param {string} weekToken - Optional week token, defaults to current week
 */
export async function generateWeeklyAnnouncement(weekToken = null) {
    try {
        console.log('📢 Starting weekly announcement generation (Employee Leaderboard)...');

        // 1. Determine Week
        let activeWeek = weekToken || await getCurrentWeekToken();
        console.log(`🔍 Checking results for Week: ${activeWeek}`);

        // 2. Fetch VM Results
        let filter = `CurrentValue.[Week]="${activeWeek}"`;
        let results = await fetchRecordsFromTable(RESULTS_TABLE_ID, filter);

        // Fallback: If no results for today's week, find the latest week with data
        if (results.length === 0 && !weekToken) {
            console.log(`⚠️ No results for ${activeWeek}. Finding latest week with data...`);
            const allResults = await fetchRecordsFromTable(RESULTS_TABLE_ID);

            if (allResults.length > 0) {
                const distinctWeeks = [...new Set(allResults.map(r => r.fields.Week).flat())].filter(w => w && w.startsWith('W'));
                distinctWeeks.sort((a, b) => b.localeCompare(a));

                activeWeek = distinctWeeks[0];
                console.log(`✅ Falling back to data from: ${activeWeek}`);

                filter = `CurrentValue.[Week]="${activeWeek}"`;
                results = await fetchRecordsFromTable(RESULTS_TABLE_ID, filter);
            }
        }

        if (results.length === 0) {
            throw new Error(`No VM results found in the system.`);
        }

        // 3. Aggregate by Employee (PIC)
        const aggregationMap = new Map();

        results.forEach(item => {
            const picRaw = item.fields['VM PIC'];
            const employee = picRaw?.users?.[0]?.name || 'Unknown';

            if (!aggregationMap.has(employee)) {
                aggregationMap.set(employee, 0);
            }
            aggregationMap.set(employee, aggregationMap.get(employee) + 1);
        });

        // Convert Map to sorted array
        const leaderboard = Array.from(aggregationMap.entries()).map(([employee, totalVM]) => ({
            employee,
            totalVM
        }));

        // Sort by totalVM descending
        leaderboard.sort((a, b) => b.totalVM - a.totalVM);

        // 4. Format Message
        let { title, text } = formatAnnouncementMessage(leaderboard.slice(0, 10), activeWeek);

        // Try AI generation if configured
        const aiText = await aiGenerateAnnouncement(leaderboard.slice(0, 10), activeWeek);
        if (aiText) {
            console.log('✨ AI specifically generated this message!');
            text = aiText;
        }

        // 5. Send to Lark Message API
        console.log('Sending Formatted Message:\n', text);

        if (!LARK_CHAT_ID) {
            console.warn('⚠️ LARK_CHAT_ID not configured. Announcement generated but not sent.');
            return { success: true, sent: false, title, text, week: activeWeek, leaderboard };
        }

        const token = await getTenantAccessToken();
        const response = await fetch(`${LARK_API_BASE}/im/v1/messages?receive_id_type=chat_id`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                receive_id: LARK_CHAT_ID,
                msg_type: 'post',
                content: JSON.stringify({
                    post: {
                        en_us: {
                            title: title,
                            content: [
                                [
                                    { tag: 'text', text: text }
                                ]
                            ]
                        }
                    }
                })
            })
        });

        const data = await response.json();
        if (data.code !== 0) {
            throw new Error(`Lark Message API error: ${data.msg}`);
        }

        console.log('✅ Weekly announcement sent via Message API!');
        return { success: true, sent: true, title, text, week: activeWeek, leaderboard, data };

    } catch (error) {
        console.error('❌ Failed to generate weekly announcement:', error);
        throw error;
    }
}
