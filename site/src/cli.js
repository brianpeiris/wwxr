const { connectMongo } = require("./utils");

(async () => {
  const { client, db } = await connectMongo();
  const pages = db.collection("pages");
  const title = process.argv[2];
  await pages.insertOne({ title });
  console.log(`inserted ${title}`);
  client.close();
})();
