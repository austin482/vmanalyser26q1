// Fix BU extraction - handle array containing string that looks like array
import fs from 'fs';

const serverPath = './server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Replace the BU extraction logic to handle all cases properly
const oldPattern = /\/\/ Extract all BU names \(handle single or multiple BUs\)\s+if \(Array\.isArray\(picBURaw\) && picBURaw\.length > 0\) \{[^}]+buNames = picBURaw\.map\(bu => bu\?\.text \|\| String\(bu\)\);[^}]+\} else if \(typeof picBURaw === 'object' && picBURaw !== null\) \{[^}]+\} else if \(picBURaw\) \{[^}]+\}/s;

const newCode = `// Extract all BU names (handle single or multiple BUs)
                console.log('🔍 DEBUG: picBURaw type:', typeof picBURaw, 'isArray:', Array.isArray(picBURaw));
                console.log('🔍 DEBUG: picBURaw value:', JSON.stringify(picBURaw));
                
                if (Array.isArray(picBURaw) && picBURaw.length > 0) {
                    // Real array - extract text from each element
                    const rawBUs = picBURaw.map(bu => bu?.text || String(bu));
                    console.log('🔍 DEBUG: rawBUs after map:', rawBUs);
                    
                    // Check if any element is a string array like "[BU1,BU2]"
                    buNames = [];
                    for (const rawBU of rawBUs) {
                        if (typeof rawBU === 'string' && rawBU.startsWith('[') && rawBU.endsWith(']')) {
                            // Parse string array
                            const parsed = rawBU.slice(1, -1).split(',').map(s => s.trim());
                            buNames.push(...parsed);
                        } else {
                            buNames.push(rawBU);
                        }
                    }
                } else if (typeof picBURaw === 'object' && picBURaw !== null) {
                    const buText = picBURaw.text || String(picBURaw);
                    if (buText.startsWith('[') && buText.endsWith(']')) {
                        buNames = buText.slice(1, -1).split(',').map(s => s.trim());
                    } else {
                        buNames = [buText];
                    }
                } else if (picBURaw) {
                    const buText = String(picBURaw);
                    if (buText.startsWith('[') && buText.endsWith(']')) {
                        buNames = buText.slice(1, -1).split(',').map(s => s.trim());
                    } else {
                        buNames = [buText];
                    }
                }
                
                console.log('🔍 DEBUG: Final buNames:', buNames)`;

content = content.replace(oldPattern, newCode);

fs.writeFileSync(serverPath, content);
console.log('✅ Fixed BU extraction with debug logging and proper array-string parsing');
