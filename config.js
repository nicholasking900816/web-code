const path = require('path')

module.exports = {
    context: __dirname,
    projectPath: path.resolve(__dirname, 'projects'),
    serverPath: path.resolve(__dirname, 'public/server'),
    serverAddress: 'http://localhost:3000'
}