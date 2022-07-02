const webpack = require('webpack');
const path = require('path');
const WebSocketServer = require('ws').WebSocketServer;
const fs = require('fs');
const config = require('../../config');

class WsServer {

    constructor() {
        this._wsServer = null;
        this._pool = new Map();
        this._intelval = null;
        this._state = 'NOT_READY';
    }

    run() {
        if (this._state === 'NOT_READY') {
            throw new Error('Ws server is not ready');
        } else if (this._state === 'RUNING') {
            return;
        }
        this._state = 'RUNNING';
        this._wsServer.on('connection', (connection) => {
            let watcher;
            connection.on('message', message => {
                let messageObj = JSON.parse(message.toString());
                if (messageObj.type === 'heartbeat') {
                    if (watcher) {
                        watcher.updateLastHeartbeat();
                    } else {
                        watcher = this._pool.get(messageObj.project);
                        watcher.compiler.events.on('compileDone', () => {
                            connection.send(JSON.stringify({type: 'CONTENT_CHANGE'}))
                        });
                        watcher.updateLastHeartbeat();
                    }
                }
            }),
            connection.on('close', () => {

            })
        }); 
        this._wsServer.on('error', err => {
            console.log(err);
        })
        this._intelval = setInterval(() => {
            this._pool.forEach((value, key) => {
                if (value.closeIfExpired()) {
                    setTimeout(() => {
                        this._pool.delete(key);
                        fs.rmSync(path.join(config.serverPath, key), {force: true, recursive: true})
                    })
                }
            })
        }, 10000)
    }

    installServer(server) {
        this._wsServer = new WebSocketServer({
            server: server
        });
        this._state = 'READY';
    }

    add(project, watcher) {
        if (this.has(project)) return;
        this._pool.set(project, watcher);
    }

    has(project) {
        return this._pool.has(project);
    }

    delete(project) {
        this._pool.delete(project);
    }
}

module.exports = new WsServer();