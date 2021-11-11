const path = require("path");
const app = require("express")();

const { connectMongo } = require("./utils");

app.set("view engine", "hbs");
app.set("views", path.resolve(__dirname, "views"));

app.get("/", async (req, res) => {
  const { client, db } = await connectMongo();
  const pages = await db.collection("pages");
  const results = await pages.find({}).toArray();
  res.render("index", { results });
});

const server = app.listen(8081, () => {
  console.log("running");
});

process.on("SIGTERM", () => server.close());
