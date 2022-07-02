const Watcher = require('../../lib/compile/watcher');
const config = require('../../config');
const Compiler = require('../../lib/compile/compile');
const path = require('path');
const webpack = require('webpack');
const wsServer = require('../../lib/compile/serve');
const util = require('./util');
const fs = require('fs');

function normalizeOptions(project) {
    let context = path.join(config.projectPath, project);
    let optionPath = path.join(context, 'webpack.config.js');
    let option, state = fs.statSync(optionPath, {throwIfNoEntry: false }) 
    if (state) {
        option = require(optionPath);
    }
    
    return {...(option || {
        entry: path.join(context, 'src/index'),
        mode: 'development',
        devtool: false
    }), context};
}

function setupPlugins(compiler) {
    let suffixReg = /\.([a-zA-Z]+)$/;

    new webpack.EntryPlugin(compiler.context, path.join(config.context, 'lib/client/wsClient/index.js'), {name: undefined}).apply(compiler);

    compiler.hooks.thisCompilation.tap('test', (compilation) => {
        compilation.hooks.afterProcessAssets.tap('test', (assets) => {
            debugger
            const assetKeys = Object.keys(assets);
            const classified = util.classify(assetKeys);
            if (!assetKeys.find(key => suffixReg.exec(key)[1] === 'html')) {
                let template = fs.readFileSync(path.join(config.context, 'lib/client/template/index.html')).toString().split('\r\n');
                classified.js.forEach((key, index) => {
                    template.splice(11 + index, 0, `    <script src="${key}"></script>`);
                })
                classified.css.forEach((key, index) => {
                    template.splice(11 + index, 0, `    <link rel="stylesheet" href="${key}">`);
                })
                compilation.emitAsset('index.html', new webpack.sources.RawSource(template.join('\r\n'), false))
            }
        })
    })
}

function projectServeMiddleware (req, res) {
    let project = req.query.project;
    let projectPath = path.join(config.projectPath, project);
    let webpackOption = normalizeOptions(project);
    let webpackCompiler = webpack(webpackOption);
    let watcher = new Watcher(new Compiler(webpackCompiler), 60000);
    
    function listener () {
        wsServer.add(project, watcher); 
        res.send({
            status: 200, 
            msg: 'Success',
            data: `${config.serverAddress}/server/${project}`
        })
        watcher.compiler.events.off('compileDone', listener)
    }

    setupPlugins(webpackCompiler);
    webpackCompiler.outputPath = path.join(config.serverPath, project);
    watcher.compiler.events.on('compileDone', listener);
    watcher.compiler.watch();
}

module.exports = projectServeMiddleware;