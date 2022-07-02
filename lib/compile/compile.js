const EventEmitter = require('events');

class Compiler {
    constructor(webpackCompiler) {
        this._compiler = webpackCompiler;
        this._watching = 'aaa';
        this.events = new EventEmitter();
        this._compiler.hooks.done.tap('compiler', (stata) => {
            this.events.emit('compileDone');
        })
    }

    watch() {
        this._watching = this._compiler.watch({}, err => console.log(err))
        return this._watching;
    }

    compile() {

    }

    close() {
        this._watching.close();
        this._watching = null;
    }
}

module.exports = Compiler;