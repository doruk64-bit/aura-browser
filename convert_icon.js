const fs = require('fs');
const pngToIco = require('png-to-ico');

pngToIco('resources/icons/icon.png')
  .then(buf => {
    fs.writeFileSync('resources/icons/icon.ico', buf);
    console.log('ICO created!');
  })
  .catch(console.error);
