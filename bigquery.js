const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

const { settlementsSchema } = require('./config/bigquery');

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
  return await db.createDataset('labreports');
};

module.exports.createTable = async () => {
  const options = {
    schema: settlementsSchema,
  };
  const [table] = await db.dataset('labreports').createTable('koatuu', options);
  return table;
};

module.exports.getTable = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataset = db.dataset('labreports');
      const [table] = await dataset.table('koatuu').get();
      resolve(table);
    } catch (err) {
      reject('table does not exist');
    }
  });
};

module.exports.insertData = async (rows) => {
  return await db.dataset('labreports').table('koatuu').insert(rows);
};
