// Simplify suggestion text for score=0 VMs
import fs from 'fs';

const serverPath = './server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Find and replace the suggestion text formatting
content = content.replace(
    /\/\/ Format suggestion text\s+const suggestionText = \[\s+'📊 Insights:',\s+\.\.\.insights\.map\(i => `• \$\{i\}`\),\s+'',\s+'💡 Suggestions:',\s+\.\.\.suggestions\.map\(s => `• \$\{s\}`\)\s+\]\.join\('\\n'\);/,
    `// Format suggestion text
                let suggestionText;
                if (score === 0) {
                    // Simple message for unrelated VMs
                    suggestionText = '❌ Not under this BU KR';
                } else {
                    // Full analysis for related VMs
                    suggestionText = [
                        '📊 Insights:',
                        ...insights.map(i => \`• \${i}\`),
                        '',
                        '💡 Suggestions:',
                        ...suggestions.map(s => \`• \${s}\`)
                    ].join('\\n');
                }`
);

fs.writeFileSync(serverPath, content);
console.log('✅ Updated: Score 0 VMs now show simple message instead of long text');
