const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const JSONStream = require('JSONStream');
const es = require('event-stream');

const { settlementsSchema, bigqueryConfig } = require('./config/bigquery');

const FIRST_LEVEL = 'Перший рівень';
const SECOND_LEVEL = 'Другий рівень';
const THIRD_LEVEL = 'Третій рівень';
const FOURTH_LEVEL = 'Четвертий рівень';
const CATEGORY = 'Категорія';
const NAME = "Назва об'єкта українською мовою";

const levels = {};

if (Object.values(bigqueryConfig).includes(undefined)) {
    console.error('no connection settings in env')
    process.exit(100);
}

const db = new BigQuery({
  projectId: bigqueryConfig.projectID,
  credentials: {
    client_email: bigqueryConfig.client_email,
    private_key: bigqueryConfig.private_key,
  },
  clientOptions: {
    clientId: bigqueryConfig.clientId,
  },
});

const createTable = () => {
  const options = {
    schema: settlementsSchema,
  };
  console.log('create table');
  return db.dataset(bigqueryConfig.datasetID).createTable(bigqueryConfig.tableID, options);
};

module.exports.getTable = async () => {
  const exists = await db.dataset(bigqueryConfig.datasetID).table(bigqueryConfig.tableID).exists();
  if (exists[0]) {
    console.log('Drop table');
    await db.dataset(bigqueryConfig.datasetID).table(bigqueryConfig.tableID).delete();
  }
  return createTable();
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
          return JSON.stringify(item) + '\n'; // JSON transformer must return newline-delimited JSON
        }
      }),
    )
    .pipe(
      db.dataset(bigqueryConfig.datasetID).table(bigqueryConfig.tableID).createWriteStream({
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
