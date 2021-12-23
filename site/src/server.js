const path = require("path");
const app = require("express")();

const { connectMongo } = require("./utils");

app.set("view engine", "hbs");
app.set("views", path.resolve(__dirname, "views"));

app.get("/", async (req, res) => {
  const { client, db } = await connectMongo();
  const pages = await db.collection("pages");

  const userAgent = (req.get("user-agent") || "").toLowerCase();
  const isAndroid = userAgent.includes("android");
  const isIDevice = userAgent.includes("iphone");
  const isAppleDevice = true || isIDevice || userAgent.includes("macintosh");

  const query = req.query.q || "";
  let lowerQuery = query.toLowerCase().trim();
  const isFilter = lowerQuery.match(/-?is:aframe/);
  let filter = () => true;
  if (isFilter) {
    lowerQuery = lowerQuery.substring(isFilter.index + isFilter[0].length);
    if (isFilter[0].startsWith("-")) {
      filter = p => !p.hasScene;
    } else {
      filter = p => p.hasScene;
    }
  }

  const page = parseInt(req.query.p || "0");
  const perPage = 10;

  let results = (await pages.find({}).toArray()).filter(p => {
    return (
      filter(p) &&
      (
        (p.title || "").toLowerCase().includes(lowerQuery) ||
        (p.description || "").toLowerCase().includes(lowerQuery) ||
        (p.url || "").toLowerCase().includes(lowerQuery)
      )
    );
  })
  const totalCount = results.length;
  results = results.slice(page * perPage, (page + 1) * perPage);

  for (const result of results) {
    result.prettyUrl = result.url.replace(/https?:\/\//, '');
    result.prettyTitle = result.title || result.url;
    for (let i = 0; i < result.models.length; i++) {
      result.models[i] = new URL(result.models[i], result.url).href;
    }
    for (let i = 0; i < result.iosModels.length; i++) {
      result.iosModels[i] = new URL(result.iosModels[i], result.url).href;
    }
  }

  res.render("index", { 
    q: req.query.q,
    isAndroid,
    isIDevice,
    isAppleDevice,
    results,
    page,
    isFirstPage: page === 0, 
    isLastPage: ((page + 1) * perPage) > totalCount,
    prevPage: page - 1,
    nextPage: page + 1,
    perPage,
    totalCount
  });
});

const server = app.listen(80, () => {
  console.log("running");
});

process.on("SIGTERM", () => server.close());
