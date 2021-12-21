const path = require("path");
const app = require("express")();

const { connectMongo } = require("./utils");

app.set("view engine", "hbs");
app.set("views", path.resolve(__dirname, "views"));

app.get("/", async (req, res) => {
  const { client, db } = await connectMongo();
  const pages = await db.collection("pages");
  const results = await pages.find({}).toArray();
  for (const result of results) {
    for (let i = 0; i < result.models.length; i++) {
      result.models[i] = new URL(result.models[i], result.url).href;
    }
  }
  res.render("index", { results });
});

const server = app.listen(80, () => {
  console.log("running");
});

process.on("SIGTERM", () => server.close());
