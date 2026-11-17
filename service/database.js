const { MongoClient } = require('mongodb');
const config = require('./dbConfig.json');

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;

const client = new MongoClient(url);
const db = client.db('rental');
const collection = db.collection('house');

async function main() {
  try {
    await client.connect();

    try {
      await db.command({ ping: 1 });
      console.log(`DB connected to ${config.hostname}`);
    } catch (ex) {
      console.error(`Database connection failed for ${config.hostname}: ${ex.message}`);
      process.exitCode = 1;
      return;
    }

    const cursor = collection.find();
    const rentals = await cursor.toArray();
    rentals.forEach((i) => console.log(i));
  } finally {
    await client.close();
  }
}

main().catch((ex) => {
  console.error(`Database operation failed: ${ex.message}`);
  process.exitCode = 1;
});