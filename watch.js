const webpack = require('webpack');
const option = require('./projects/project1/webpack.config');

const compiler = webpack(option);
const reg = /\.html$/;
const fs = require('fs');
const path = require('path');
const option = require.ensure()

compiler.hooks.thisCompilation.tap('test', (compilation) => {
    compilation.hooks.afterProcessAssets.tap('test', (assets) => {
        debugger;
        const assetKeys = Object.keys(assets);
        if (!assetKeys.find(key => reg.test(key))) {
            let template = fs.readFileSync(path.join(__dirname, 'lib/client/template/index.html')).toString().split('\r\n');
            assetKeys.forEach((key, index) => {
                template.splice(7 + index, 0, `<script src="${key}"></script>`)
            })
            compilation.emitAsset('index.html', new webpack.sources.RawSource(template.join('\r\n'), false))
            console.log(template);
        }
    })
})

const watch = compiler.watch({}, err => console.log(err));

console.log(watch);
debugger;