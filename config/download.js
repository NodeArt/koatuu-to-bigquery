const os = require('os');

module.exports.directory = process.env.KOATUU_DIR ?? os.tmpdir();
module.exports.downloadLink = process.env.DOWNLOAD_LINK ?? 'https://data.gov.ua/dataset/d945de87-539c-45b4-932a-7dda57daf8d9/resource/296adb7a-476a-40c8-9de6-211327cb3aa1/download/koatuu.json';
module.exports.fileName = process.env.FILE_NAME ?? 'koatuu.json';
