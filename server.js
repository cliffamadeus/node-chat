
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
  console.log('User connected:', socket.id);

  socket.on('join', (nickname) => {
    socket.nickname = nickname;

    io.emit('system', {
      text: `${nickname} joined the chat`,
      time: getPHTime()
    });
  });

  socket.on('message', (msg) => {
    io.emit('message', {
      user: socket.nickname,
      text: msg,
      time: getPHTime()
    });
  });

  socket.on('disconnect', () => {
    if (socket.nickname) {
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