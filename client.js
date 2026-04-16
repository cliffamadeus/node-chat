const ioClient = require('socket.io-client');
const readline = require('readline');

const socket = ioClient('http://192.168.100.250:3000');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let nickname = '';

rl.question('Enter your nickname: ', (name) => {
  nickname = name;
  socket.emit('join', nickname);

  rl.setPrompt('> ');
  rl.prompt();

  rl.on('line', (line) => {
    const msg = line.trim();
    if (msg) {
      socket.emit('message', msg);
    }
    rl.prompt();
  });
});

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