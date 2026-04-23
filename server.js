const { Server } = require('socket.io');
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Config
const PORT = 3000;
const LOG_DIR = path.join(__dirname, 'logs');

// State
let chatHistory = [];

// Utils
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

function getDateString() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// Logging
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
  }
}

function saveLogs() {
  if (chatHistory.length === 0) return;

  const ip = getLocalIP();
  const date = getDateString();
  const fileName = `${ip}-${date}.txt`;
  const filePath = path.join(LOG_DIR, fileName);

  const content = chatHistory.join('\n') + '\n';

  fs.appendFileSync(filePath, content);
  console.log(`Logs saved to ${filePath}`);

  // Optional: clear memory after saving to avoid duplicates
  chatHistory = [];
}

// Server 
function createHTTPServer() {
  return http.createServer();
}

function createSocketServer(server) {
  return new Server(server, {
    cors: { origin: '*' }
  });
}

// Socket Handlers
function handleConnection(io) {
  io.on('connection', (socket) => {
    const time = getPHTime();

    console.log(`[CONNECT] ${time} - ID: ${socket.id}`);

    // Log connect
    chatHistory.push(`${time}:SYSTEM - User connected (ID: ${socket.id})`);

    handleJoin(socket, io);
    handleMessage(socket, io);
    handleDisconnect(socket, io);
  });
}

function handleJoin(socket, io) {
  socket.on('join', (nickname) => {
    const time = getPHTime();

    socket.nickname = nickname;

    console.log(`[JOIN] ${time} - ${nickname} (ID: ${socket.id})`);

    // Log join
    chatHistory.push(`${time}:${nickname} - joined the chat`);

    io.emit('system', {
      text: `${nickname} joined the chat`,
      time: time
    });
  });
}

function handleMessage(socket, io) {
  socket.on('message', (msg) => {
    const time = getPHTime();

    console.log(`[MSG] ${time} - ${socket.nickname} (${socket.id}): ${msg}`);

    // Log message
    chatHistory.push(`${time}:${socket.nickname} - ${msg}`);

    io.emit('message', {
      user: socket.nickname,
      text: msg,
      time: time
    });
  });
}

function handleDisconnect(socket, io) {
  socket.on('disconnect', () => {
    const time = getPHTime();

    if (socket.nickname) {
      console.log(`[LEAVE] ${time} - ${socket.nickname} (ID: ${socket.id})`);

      // Log left the chat
      chatHistory.push(`${time}:${socket.nickname} - left the chat`);

      io.emit('system', {
        text: `${socket.nickname} left the chat`,
        time: time
      });
    } else {
      // disconnected before joining
      chatHistory.push(`${time}:SYSTEM - User disconnected (ID: ${socket.id})`);
    }
  });
}

// Lifecycle handling
function setupShutdownHooks() {
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', saveLogs);
}

function shutdown() {
  console.log('\nShutting down server...');
  saveLogs();
  process.exit();
}

// Start server
function startServer(port = PORT) {
  ensureLogDir();

  const server = createHTTPServer();
  const io = createSocketServer(server);

  handleConnection(io);

  const host = getLocalIP();

  server.listen(port, () => {
    console.log(`Server running at:`);
    console.log(`→ Local:   http://localhost:${port}`);
    console.log(`→ Network: http://${host}:${port}`);
  });

  setupShutdownHooks();
}

// Server entry 
startServer();