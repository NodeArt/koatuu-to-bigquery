const os = require('os');

require('dotenv').config();

const { getTable, insertData } = require('./bigquery');
const { fileName } = require('./config/download');

const main = async () => {
  try {
    await getTable();
    insertData(`${os.tmpdir()}/${fileName}`);
  } catch (err) {
    console.error(err);
  }
};

main();
