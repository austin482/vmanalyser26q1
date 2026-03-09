// Quick test of the newest API key
const API_KEY = 'AIzaSyCmheSUS3Ut2mClWtSfSvilATSiJOL50oQ';
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';

async function testKey() {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say OK" }] }]
            })
        });

        if (response.ok) {
            console.log('✅ API KEY WORKS! Quota available.');
            const data = await response.json();
            console.log('Response:', data.candidates[0].content.parts[0].text);
        } else {
            const error = await response.text();
            console.log('❌ API KEY FAILED');
            console.log('Error:', error);

            if (error.includes('RESOURCE_EXHAUSTED')) {
                console.log('\n💡 QUOTA EXHAUSTED - Free tier limit reached');
            }
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
}

testKey();
