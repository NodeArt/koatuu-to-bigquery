const https = require('https');
const fs = require('fs');
const os = require('os');

const file = fs.createWriteStream(`${os.tmpdir()}/koatuu.json`);
https.get('https://data.gov.ua/dataset/d945de87-539c-45b4-932a-7dda57daf8d9/resource/296adb7a-476a-40c8-9de6-211327cb3aa1/download/koatuu.json', (response) => {
  response.pipe(file);
});
