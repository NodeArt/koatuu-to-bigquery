const https = require('https');
const fs = require('fs');
const os = require('os');

require('dotenv').config();

const { downloadLink, fileName } = require('./config/download');

const file = fs.createWriteStream(`${os.tmpdir()}/${fileName}`);

https.get(downloadLink, (response) => {
  response.pipe(file);
});
