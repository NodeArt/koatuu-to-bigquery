require('dotenv').config();

const { getTable, insertData } = require('./bigquery');
const { directory, fileName } = require('./config/download');

const main = async () => {
  await getTable();
  insertData(`${directory}/${fileName}`);
};

main();
