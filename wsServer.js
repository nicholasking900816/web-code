
const WebSocketServer = require('ws').WebSocketServer;
const http = require('http');

const server = http.createServer();
const wss = new WebSocketServer({server: server});

server.listen(8081);

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
})