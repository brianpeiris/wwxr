const { connectMongo } = require("./utils");

(async () => {
  const { client, db } = await connectMongo();

  const pages = db.collection("pages");

  const command = process.argv[2];

  if (command === "insert") {
    const title = process.argv[3];
    await pages.insertOne({ title });
    console.log(`inserted ${title}`);
  } else if (command === "delete_all") {
    const result = await pages.deleteMany({});
    console.log(`deleted ${result.deletedCount}`)
  }

  client.close();
})();
