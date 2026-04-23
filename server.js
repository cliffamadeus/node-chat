const { Server } = require('socket.io');
const http = require('http');
const os = require('os');

//Utitlities 
function getLocalIP() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return 'localhost';
}

function getPHTime() {
  return new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila'
  });
}

//Server setup
function createHTTPServer() {
  return http.createServer();
}

function createSocketServer(server) {
  return new Server(server, {
    cors: { origin: '*' }
  });
}

//Handlers
function handleConnection(io) {
  io.on('connection', (socket) => {
    console.log(`[CONNECT] ${getPHTime()} - ID: ${socket.id}`);

    handleJoin(socket, io);
    handleMessage(socket, io);
    handleDisconnect(socket, io);
  });
}

function handleJoin(socket, io) {
  socket.on('join', (nickname) => {
    socket.nickname = nickname;

    console.log(`[JOIN] ${getPHTime()} - ${nickname} (ID: ${socket.id})`);

    io.emit('system', {
      text: `${nickname} joined the chat`,
      time: getPHTime()
    });
  });
}

function handleMessage(socket, io) {
  socket.on('message', (msg) => {
    console.log(`[MSG] ${getPHTime()} - ${socket.nickname} (${socket.id}): ${msg}`);

    io.emit('message', {
      user: socket.nickname,
      text: msg,
      time: getPHTime()
    });
  });
}

function handleDisconnect(socket, io) {
  socket.on('disconnect', () => {
    if (socket.nickname) {
      console.log(`[LEAVE] ${getPHTime()} - ${socket.nickname} (ID: ${socket.id})`);

      io.emit('system', {
        text: `${socket.nickname} left the chat`,
        time: getPHTime()
      });
    }
  });
}

//Start server
function startServer(port = 3000) {
  const server = createHTTPServer();
  const io = createSocketServer(server);

  handleConnection(io);

  const host = getLocalIP();

  server.listen(port, () => {
    console.log(`Server running at:`);
    console.log(`→ Local:   http://localhost:${port}`);
    console.log(`→ Network: http://${host}:${port}`);
  });
}

//Start
startServer();