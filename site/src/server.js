const app = require("express")();

app.get("/", (req, res) => {
  res.send("hai");
});

const server = app.listen(8081, () => {
  console.log("running");
});

process.on("SIGTERM", () => server.close());
