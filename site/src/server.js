const path = require("path");
const fs = require("fs");
const hbs = require("hbs");
const app = require("express")();
const md = new require("markdown-it")({html: true});

const { connectMongo } = require("./utils");

hbs.registerPartials(path.resolve(__dirname, "views", "partials"));

app.set("view engine", "hbs");
app.set("views", path.resolve(__dirname, "views"));

app.get("/explore", async (req, res) => {
  const { client, db } = await connectMongo();
  const pages = await db.collection("pages");
  const words = new Map();
  const pageList = (await pages.find({}).toArray())
  .filter(p => !p.url.includes("thirdlove.com"))
  .filter(p => !p.url.includes("store.ui.com"))
  let maxCount = 0;
  const commonWords = "has have avec mit der vous une very more out use all its than die and are the you our with this your that will for from can back which also need any one und pour sur les".split(" ");
  for (const page of pageList) {
    const pageWords = ((page.title || "") + " " + (page.description || "")).toLowerCase().split(" ");
    for (word of pageWords) {
      /*
      const cleanWord = word.trim().replaceAll(/[\n~!@#$%\^&*()-_=+\[{\]};:'"\\\|,<.>/?`]/g, ' ').trim();
      if (cleanWord.length <= 2) continue;
      if (commonWords.includes(cleanWord)) continue;
      */
      const cleanWord = new URL(page.url).hostname;
      if (!words.has(cleanWord)) words.set(cleanWord, 0);
      const newCount = words.get(cleanWord) + 1;
      words.set(cleanWord, newCount);
      if (newCount > maxCount) maxCount = newCount;
    }
  }

  console.log(Array.from(words.entries()).length);

  const wordArr = Array.from(words.entries())
    .filter(([word, count]) => count / maxCount > 0.005)
    .map(([word, count]) => ([word, Math.max(10, Math.log(count / maxCount * 100) * 20)]));

  res.render("explore", {
    words: wordArr
  });
});

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
      filter = (p) => !p.hasScene;
    } else {
      filter = (p) => p.hasScene;
    }
  }

  const page = parseInt(req.query.p || "0");
  const perPage = 10;

  let results = (await pages.find({}).toArray()).filter((p) => {
    return (
      filter(p) &&
      ((p.title || "").toLowerCase().includes(lowerQuery) ||
        (p.description || "").toLowerCase().includes(lowerQuery) ||
        (p.url || "").toLowerCase().includes(lowerQuery))
    );
  })
  .filter(p => !p.url.includes("thirdlove.com"))
  .filter(p => !p.url.includes("store.ui.com"))
  const totalCount = results.length;
  results = results.slice(page * perPage, (page + 1) * perPage);

  for (const result of results) {
    result.prettyUrl = result.url.replace(/https?:\/\//, "");
    result.prettyTitle = result.title || result.url;
    if (result.models) {
      for (let i = 0; i < result.models.length; i++) {
        result.models[i] = new URL(result.models[i], result.url).href;
      }
    }
    if (result.iosModels) {
      for (let i = 0; i < result.iosModels.length; i++) {
        result.iosModels[i] = new URL(result.iosModels[i], result.url).href;
      }
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
    isLastPage: (page + 1) * perPage >= totalCount,
    prevPage: page - 1,
    nextPage: page + 1,
    perPage,
    totalCount,
  });
});

app.get("/blog", (req, res) => {
  const files = fs.readdirSync(path.resolve(__dirname, "..", "blog")).filter(f => f.endsWith('.md'));
  files.sort();
  const posts = files.map(file => {
    let [date, rest] = file.split("--");
    const prettyDate = date.replace("T", " ");
    slug = rest.replace(/\.md$/, "");
    const title = slug.replaceAll("-", " ");
    return {date, prettyDate, title, slug};
  });
  res.render("blog", {posts});
});

app.get("/blog/:post", (req, res) => {
  const [date, slug] = req.params.post.split("--");
  const file = `${req.params.post}.md`
  const filePath = path.resolve(__dirname, "..", "blog", file)
  if (fs.existsSync(filePath)) {
    res.render("post", {
      date, slug,
      prettyDate: date.replace("T", " "),
      title: slug.replaceAll("-", " "),
      content: md.render(fs.readFileSync(filePath, 'utf8'))
    });
  } else {
    res.sendStatus(404);
  }
});

const server = app.listen(80, () => {
  console.log("running");
});

process.on("SIGTERM", () => server.close());
