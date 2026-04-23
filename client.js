const ioClient = require('socket.io-client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let socket;
let nickname = '';
let attempts = 0;
const MAX_ATTEMPTS = 5;
let currentURL = '';

//Star client
function start() {
  attempts = 0;
  askServerDetails();
}

//Server details
function askServerDetails() {
  rl.question('Enter server IP address: ', (ip) => {
    rl.question('Enter server port: ', (port) => {
      currentURL = `http://${ip}:${port}`;
      createConnection(currentURL);
    });
  });
}

//Socket conn
function createConnection(url) {
  attempts++;
  console.log(`Connecting to ${url} (Attempt ${attempts}/${MAX_ATTEMPTS})...`);

  socket = ioClient(url, {
    reconnection: false, // we handle retries manually
    timeout: 5000
  });

  handleConnection(socket);
  handleMessages(socket);
}

//Connection events
function handleConnection(socket) {
  socket.on('connect', () => {
    console.log('Connected to server');
    askNickname();
  });

  socket.on('connect_error', (err) => {
    console.log('Connection failed:', err.message);

    if (attempts < MAX_ATTEMPTS) {
      retry();
    } else {
      console.log('Max connection attempts reached.');
      restart();
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');

    if (attempts < MAX_ATTEMPTS) {
      retry();
    } else {
      console.log('Max reconnection attempts reached.');
      restart();
    }
  });
}

//Retry connection
function retry() {
  console.log('Retrying...\n');

  setTimeout(() => {
    createConnection(currentURL);
  }, 2000); // 2 sec delay between attempts
}

//Input nickname
function askNickname() {
  rl.question('Enter your nickname: ', (name) => {
    nickname = name;
    socket.emit('join', nickname);
    setupChat();
  });
}

//Chat loop
function setupChat() {
  rl.setPrompt('> ');
  rl.prompt();

  rl.removeAllListeners('line');

  rl.on('line', (line) => {
    const msg = line.trim();
    if (msg) {
      socket.emit('message', msg);
    }
    rl.prompt();
  });
}

//Message handlers
function handleMessages(socket) {
  socket.on('message', (msg) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    console.log(`[${msg.time}] ${msg.user}: ${msg.text}`);
    rl.prompt(true);
  });

  socket.on('system', (msg) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    console.log(`[${msg.time}] ${msg.text}`);
    rl.prompt(true);
  });
}

//restart
function restart() {
  console.log('\nRestarting...\n');
  start();
}

//Instantiate start program
start();