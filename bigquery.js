const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream');
require('dotenv').config();

const { settlementsSchema } = require('./config/bigquery');

const FIRST_LEVEL = 'Перший рівень';
const SECOND_LEVEL = 'Другий рівень';
const THIRD_LEVEL = 'Третій рівень';
const FOURTH_LEVEL = 'Четвертий рівень';
const CATEGORY = 'Категорія';
const NAME = "Назва об'єкта українською мовою";

const levels = {};

const datasetId = process.env.DATASET_NAME; // todo: no check for null or defaule value
const tableId = process.env.TABLE ?? 'koatuu'; // like that one

const db = new BigQuery({
  projectId: process.env.PROJECT_ID,
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: decodeURI(process.env.PRIVATE_KEY),
  },
  clientOptions: {
    clientId: process.env.CLIENT_ID,
  },
});

module.exports.createDataset = async () => { // todo: async will give you promise, but
  return await db.createDataset(datasetId); // await not needed here
};

const createTable = async () => {
  const options = {
    schema: settlementsSchema,
  };
  const [table] = await db.dataset(datasetId).createTable(tableId, options);
  return table;
};

module.exports.getTable = () => { // todo: rewrite that function
  return new Promise(async (resolve, reject) => {
    try {
      const exists = await db.dataset(datasetId).table(tableId).exists();
      console.log('Table exists:', exists[0]);
      if (exists[0]) {
        await db.dataset(datasetId).table(tableId).delete(); // you may make it optional using ?
        console.log('Drop table');
        const table = await createTable();
        console.log('Create table');
        resolve(table);
      } else {
        throw Error('table does not exist'); // todo: do not throw, no need in try catch here
      }
    } catch (err) {
      try {
        const table = await createTable(); // todo: this code doubled, flow is wrong
        console.log('Create table');
        resolve(table);
      } catch (error) { // todo: err in err :)
        reject(error);
      }
    }
  });
};

module.exports.insertData = (file) => {
  const parser = JSONStream.parse('*');
  fs.createReadStream(file)
    .pipe(parser)
    .pipe(
      es.mapSync((data) => {
        if (
          data[FIRST_LEVEL] &&
          !data[SECOND_LEVEL] &&
          !data[THIRD_LEVEL] &&
          !data[FOURTH_LEVEL] &&
          !levels[data[FIRST_LEVEL]]
        ) {
          levels[data[FIRST_LEVEL]] = data[NAME];
        }

        if (
          data[SECOND_LEVEL] &&
          +data[SECOND_LEVEL].toString().slice(3, 5) &&
          !data[THIRD_LEVEL] &&
          !data[FOURTH_LEVEL] &&
          !levels[data[SECOND_LEVEL]]
        ) {
          levels[data[SECOND_LEVEL]] = data[NAME];
        }

        if (
          data[THIRD_LEVEL] &&
          +data[THIRD_LEVEL].toString().slice(6, 8) &&
          !data[FOURTH_LEVEL] &&
          !levels[data[THIRD_LEVEL]]
        ) {
          levels[data[THIRD_LEVEL]] = data[NAME];
        }

        if (data[CATEGORY]) {
          const code = [
            data[FIRST_LEVEL],
            data[SECOND_LEVEL],
            data[THIRD_LEVEL],
            data[FOURTH_LEVEL],
          ].filter((level) => level);

          const item = {
            Code: code[code.length - 1].toString(),
            Region: levels[data[FIRST_LEVEL]],
            City: levels[data[SECOND_LEVEL]],
            District: levels[data[THIRD_LEVEL]] || '',
            Village: data[FOURTH_LEVEL] ? data[NAME] : '',
          };
          return JSON.stringify(item) + '\n'; // todo: write an explanation comment, it's not obviouse
        }
      }),
    )
    .pipe(
      db.dataset(datasetId).table(tableId).createWriteStream({
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
      }),
    )
    .on('error', (err) => {
      console.error('Error!', err);
    })
    .on('complete', () => {
      console.log('All done!');
    });
};
