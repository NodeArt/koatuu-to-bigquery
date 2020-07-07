const os = require('os');

require('dotenv').config(); // todo: you run it multiple times in different files... Mistaken?

const { getTable, insertData } = require('./bigquery');
const { fileName } = require('./config/download');

const main = async () => {
  try {
    await getTable();
    // todo: ese env, fallback to tmpdir
    insertData(`${os.tmpdir()}/${fileName}`);
  } catch (err) {
    console.error(err);
  }
};

main();
