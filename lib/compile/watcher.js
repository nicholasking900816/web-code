class Watcher {
    constructor(compiler, duration) {
        this.compiler = compiler;
        this.lastHeartbeat = Date.now();
        this.duration = duration;
    }

    closeIfExpired() {
        if (Date.now() - this.lastHeartbeat > this.duration) {
            debugger;
            this.compiler.close();
            return true;
        }
    }

    updateLastHeartbeat() {
        this.lastHeartbeat = Date.now();
    }
}

module.exports = Watcher