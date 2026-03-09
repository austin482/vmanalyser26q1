# API Configuration

## OpenAI API Key

To enable AI-powered analysis, you need to add your OpenAI API key.

### Steps:

1. Get your API key from: https://platform.openai.com/api-keys
2. Open `src/services/strategicCompass.js`
3. Replace `YOUR_OPENAI_API_KEY_HERE` with your actual API key

```javascript
const OPENAI_API_KEY = 'sk-proj-...'; // Your actual key
```

### Note:
- Without an API key, the system will use mock analysis (rule-based)
- The mock analysis is functional but less sophisticated than AI-powered analysis
- API calls cost money - approximately $0.01-0.03 per analysis

### Security:
⚠️ **Important**: Never commit your API key to version control!
- Add `.env` support later for production use
- For now, this is a development placeholder
