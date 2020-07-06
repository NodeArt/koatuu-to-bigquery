const os = require('os');

require('dotenv').config();

const { getTable, insertData } = require('./bigquery');

const main = async () => {
  try {
    await getTable();
    insertData(`${os.tmpdir()}/koatuu.json`);
  } catch (err) {
    console.error(err);
  }
};

main();
