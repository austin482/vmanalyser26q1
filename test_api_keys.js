// Quick API key test - checks which keys are working
const GEMINI_API_KEYS = [
    'AIzaSyCBHchEn4UX-hZHYCd4796D4FldPqG8CT0',
    'AIzaSyBRmrk2JqVQT_P9cNrl8iMjox5mfjaLLWA',
    'AIzaSyD3yZOHIfqnf_eUTabiOQz75rAxpIYpSvk',
    'AIzaSyBpYoR3t4k4Kc8CpNkYgTPs870fKi7MYiE',
    'AIzaSyDSKhr93iL1Ktklr8oMJSHdZxgy8n-GH24',
    'AIzaSyDVfGD9g3WPbh4j-ml_q7cTl8RsJ3zOMOM',
    'AIzaSyD4ZIuFC2G1_H-31Y_W8XtIvqlMtcaOrwc',
    'AIzaSyCnSubwso3SoourZSfFXdgU2JhblOuRq58'
];

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

async function testAPIKey(key, index) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say 'OK'" }] }]
            })
        });

        if (response.ok) {
            return { index: index + 1, status: '✅ WORKING', key: key.substring(0, 20) + '...' };
        } else {
            const error = await response.text();
            if (error.includes('RESOURCE_EXHAUSTED')) {
                return { index: index + 1, status: '❌ QUOTA EXHAUSTED', key: key.substring(0, 20) + '...' };
            } else if (error.includes('404')) {
                return { index: index + 1, status: '⚠️ MODEL NOT FOUND', key: key.substring(0, 20) + '...' };
            } else {
                return { index: index + 1, status: `❌ ERROR: ${response.status}`, key: key.substring(0, 20) + '...' };
            }
        }
    } catch (error) {
        return { index: index + 1, status: `❌ NETWORK ERROR`, key: key.substring(0, 20) + '...' };
    }
}

async function testAllKeys() {
    console.log('🔍 Testing all 8 API keys...\n');

    const results = [];
    for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
        console.log(`Testing key ${i + 1}/8...`);
        const result = await testAPIKey(GEMINI_API_KEYS[i], i);
        results.push(result);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 API KEY STATUS REPORT:');
    console.log('='.repeat(80));
    results.forEach(r => {
        console.log(`Key ${r.index}: ${r.status}`);
    });

    const workingKeys = results.filter(r => r.status.includes('WORKING')).length;
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Working keys: ${workingKeys}/${GEMINI_API_KEYS.length}`);
    console.log(`❌ Failed keys: ${GEMINI_API_KEYS.length - workingKeys}/${GEMINI_API_KEYS.length}`);
}

testAllKeys();
