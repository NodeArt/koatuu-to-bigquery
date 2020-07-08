module.exports.bigqueryConfig = {
  datasetID: process.env.DATASET_NAME,
  tableID: process.env.TABLE,
  projectID: process.env.BIGQUERY_PROJECT_ID,
  private_key: decodeURI(process.env.PRIVATE_KEY),
  clientId: process.env.CLIENT_ID,
  client_email: process.env.CLIENT_EMAIL,
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
