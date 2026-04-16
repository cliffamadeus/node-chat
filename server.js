const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*' }
});

function getPHTime() {
  return new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila'
  });
}

io.on('connection', (socket) => {
  console.log(`[CONNECT] ${getPHTime()} - ID: ${socket.id}`);

  socket.on('join', (nickname) => {
    socket.nickname = nickname;

    // SERVER ONLY LOG (nickname + id)
    console.log(`[JOIN] ${getPHTime()} - ${nickname} (ID: ${socket.id})`);

    // Broadcast clean system message (no socket id)
    io.emit('system', {
      text: `${nickname} joined the chat`,
      time: getPHTime()
    });
  });

  socket.on('message', (msg) => {
    // SERVER ONLY LOG
    console.log(`[MSG] ${getPHTime()} - ${socket.nickname} (${socket.id}): ${msg}`);

    // Broadcast clean message to clients
    io.emit('message', {
      user: socket.nickname,
      text: msg,
      time: getPHTime()
    });
  });

  socket.on('disconnect', () => {
    if (socket.nickname) {
      // SERVER ONLY LOG
      console.log(`[LEAVE] ${getPHTime()} - ${socket.nickname} (ID: ${socket.id})`);

      io.emit('system', {
        text: `${socket.nickname} left the chat`,
        time: getPHTime()
      });
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});