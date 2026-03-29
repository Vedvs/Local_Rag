const fs = require('fs');
const content = fs.readFileSync('src/components/LandingPage.jsx', 'utf8');
const lines = content.split('\n');
// Fix line 470 (index 469) - replace problematic line with correct one
lines[469] = "              { step: '01', title: 'Register', desc: \"Authenticate with your device fingerprint or Face ID. Your biometric never leaves your device.\", icon: '\\ud83d\\udc46' },";
fs.writeFileSync('src/components/LandingPage.jsx', lines.join('\n'), 'utf8');
console.log('Fixed! Line 470 is now:', lines[469]);
