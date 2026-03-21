const { spawn } = require('child_process');
const fs = require('fs');

const log = fs.createWriteStream('npx_electron_debug.log');

const child = spawn('npx', ['electron', '.'], { shell: true });

child.stdout.on('data', (data) => {
  log.write(data);
});

child.stderr.on('data', (data) => {
  log.write(`[ERR] ${data}`);
});

child.on('close', (code) => {
  log.write(`\nProcess exited with code ${code}`);
  log.end();
});
