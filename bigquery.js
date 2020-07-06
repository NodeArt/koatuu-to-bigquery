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

const datasetId = process.env.DATASET_NAME;
const tableId = process.env.TABLE;

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

module.exports.createDataset = async () => {
  return await db.createDataset(datasetId);
};

const createTable = async () => {
  const options = {
    schema: settlementsSchema,
  };
  const [table] = await db.dataset(datasetId).createTable(tableId, options);
  return table;
};

module.exports.getTable = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const exists = await db.dataset(datasetId).table(tableId).exists();
      if (exists[0]) {
        await db.dataset(datasetId).table(tableId).delete();
        const table = await createTable();
        resolve(table);
      } else {
        throw Error('table does not exist');
      }
    } catch (err) {
      try {
        const table = await createTable();
        resolve(table);
      } catch (err) {
        reject(err);
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
          return JSON.stringify(item) + '\n';
        }
      }),
    )
    .pipe(
      db.dataset(datasetId).table(tableId).createWriteStream({
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
      }),
    )
    .on('error', (e) => {
      console.error('Error!', e);
    })
    .on('complete', (job) => {
      console.log('All done!', job);
    });
};
