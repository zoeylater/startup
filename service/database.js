const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${encodeURIComponent(config.userName)}:${encodeURIComponent(config.password)}@${config.hostname}/`;
const client = new MongoClient(url);

async function connectDatabase() {
  await client.connect();
  const database = client.db('rental');
  await database.command({ ping: 1 });
  return database;
}

async function closeDatabase() {
  await client.close();
}

module.exports = {
  closeDatabase,
  connectDatabase,
};
