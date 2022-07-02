const fs = require('fs');
const path = require('path');

fs.rmSync(path.join(__dirname, 'public/server/project1'), {recursive: true, force: true});