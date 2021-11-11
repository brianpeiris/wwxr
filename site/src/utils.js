const { MongoClient } = require("mongodb");

function connectMongo(url = "mongodb://db:27017", dbName = "wwxr") {
  return new Promise((resolve, reject) => {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    client.connect((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ client, db: client.db(dbName) });
    });
  });
}

module.exports = {
  connectMongo,
};
