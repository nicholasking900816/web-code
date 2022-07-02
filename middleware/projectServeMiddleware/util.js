const fs = require('fs');

function classify(assets) {
    let result = {
        js: [],
        css: []
    }
    let suffixExtraction = /\.([a-zA-Z]+)$/;
    assets.forEach(asset => {
        let suffix = suffixExtraction.exec(asset)[1];
        if ( suffix === 'js') {
            result.js.push(asset)
        } else if ( suffix === 'css' ) {
            result.css.push(asset)
        }
    })
    return result;
}

function fileExit(filename) {
}

module.exports = {
    classify
}