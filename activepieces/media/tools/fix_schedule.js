const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Puola viikkokatsaus.json');
let content = fs.readFileSync(filePath, 'utf8');

// Korvaa aikakentät
content = content.replace(/"hour_of_the_day": 6/g, '"hour_of_the_day": 8');
content = content.replace(/"run_on_weekends": false/g, '"run_on_weekends": true');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Aikakentät korjattu');