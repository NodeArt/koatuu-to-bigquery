require('dotenv').config();

const { getTable, insertData } = require('./bigquery');
const { directory, fileName } = require('./config/download');

const main = async () => {
  try {
    await getTable();
    insertData(`${directory}/${fileName}`);
  } catch (err) {
    console.error(err);
  }
};

main();
