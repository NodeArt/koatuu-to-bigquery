require('dotenv').config();

module.exports.bigqueryConfig = {
  datasetID: process.env.DATASET_NAME,
  usersTable: process.env.TABLE,
  projectID: process.env.BIGQUERY_PROJECT_ID,
};

module.exports.settlementsSchema = [
  {
    name: 'Code',
    type: 'STRING',
    mode: 'REQUIRED',
  },
  {
    name: 'Region',
    type: 'STRING',
    mode: 'REQUIRED',
  },
  {
    name: 'City',
    type: 'STRING',
    mode: 'REQUIRED',
  },
  {
    name: 'District',
    type: 'STRING',
  },
  {
    name: 'Village',
    type: 'STRING',
  },
];
