const fs = require('fs');
try {
  const log = fs.readFileSync('build_log.txt', 'utf16le');
  console.log(log);
} catch (e) {
  console.error(e);
}
