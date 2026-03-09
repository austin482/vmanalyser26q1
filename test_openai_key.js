// Quick test of OpenAI API key
const OPENAI_API_KEY = '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';
const OPENAI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testKey() {
    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'HTTP-Referer': 'https://austina.app',
                'X-Title': 'Austina Test'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [{
                    role: 'user',
                    content: 'Say "API key works!"'
                }],
                max_tokens: 50
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API KEY WORKS!');
            console.log('Response:', data.choices[0].message.content);
        } else {
            const error = await response.text();
            console.log('❌ API KEY FAILED');
            console.log('Status:', response.status);
            console.log('Error:', error);
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
}

testKey();
