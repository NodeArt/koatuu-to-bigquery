const https = require('https');
const fs = require('fs');

require('dotenv').config();

const { directory, downloadLink, fileName } = require('./config/download');

const file = fs.createWriteStream(`${directory}/${fileName}`);

https.get(downloadLink, (response) => {
  response.pipe(file);
});
