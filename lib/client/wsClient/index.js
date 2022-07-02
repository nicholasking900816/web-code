// Create WebSocket connection.
const location = window.location;
const wsAddress = `ws://${location.host}/listen`;

const socket = new WebSocket(wsAddress);
const projectName = /^\/server\/([^\/]+)/.exec(location.pathname)[1]; 


// Connection opened
socket.addEventListener('open', function (event) {
    socket.send(`{"type": "heartbeat", "project": "${projectName}"}`);
});

// Listen for messages
socket.addEventListener('message', function (event) {
    let data = JSON.parse(event.data); 
    if (data.type === 'CONTENT_CHANGE') {
        location.reload()
    }
});

setInterval(() => {
    socket.send(`{"type": "heartbeat", "project": "${projectName}"}`)
}, 30000)