const path = require("path");
const fs = require("fs");
const hbs = require("hbs");
const https = require("https");
const express = require("express");
const app = express();
const md = new require("markdown-it")({ html: true });
const shuffle = require("lodash.shuffle");

const { connectMongo } = require("./utils");

hbs.registerPartials(path.resolve(__dirname, "views", "partials"));

app.set("view engine", "hbs");
app.set("views", path.resolve(__dirname, "views"));

app.use("/static", express.static(path.resolve(__dirname, "..", "static")));

app.get("/", (req, res) => {
  res.render("index");
});

const excludedDomains = [
    "thirdlove.com",
    "store.ui.com",
    "welovemebel.com.ua",
];

const exploreCache = new Map();

app.get("/explore", async (req, res) => {
  const { client, db } = await connectMongo();
  const pages = await db.collection("pages");

  const category = req.query.c || "keywords";
  const type = req.query.t || "all";

  const key = [category, type].join("-");

  if (!exploreCache.has(key)) {
    let filter = {
      all: () => true,
      aframe: (p) => p.hasScene,
      gltf: (p) => p.models && p.models.length,
      usdz: (p) => p.iosModels && p.iosModels.length,
    }[type];
    if(!filter) filter = () => true;

    const pageList = (await pages.find({}).toArray())
      .filter((p) => excludedDomains.every(d => !p.url.includes(d)))
      .filter(filter)

    const words = new Map();
    const commonWords = `
      has have avec mit der vous une very more out use all
      its than die and are the you our with this your that
      will for from can back which also need any one und
      pour sur les size width height made make set new des
      och into most non ist est not für now but sans
    `.trim().replaceAll(/\n/g, " ").split(" ").filter(w => !!w);

    let maxCount = 0;
    for (const page of pageList) {
      if (category === "keywords") {
        const pageWords = ((page.title || "") + " " + (page.description || ""))
          .toLowerCase()
          .replaceAll(/[\n~!@#$%\^&*()-_=+\[{\]};:'"\\\|,<.>/?`]/g, ' ')
          .split(" ");
        for (word of pageWords) {
          const cleanWord = word;
          if (cleanWord.length <= 2) continue;
          if (commonWords.includes(cleanWord)) continue;
          if (!words.has(cleanWord)) words.set(cleanWord, 0);
          const newCount = words.get(cleanWord) + 1;
          words.set(cleanWord, newCount);
          if (newCount > maxCount) maxCount = newCount;
        }
      } else {
        const cleanWord = new URL(page.url).hostname.replace(/^www\./, "");
        if (!words.has(cleanWord)) words.set(cleanWord, 0);
        const newCount = words.get(cleanWord) + 1;
        words.set(cleanWord, newCount);
        if (newCount > maxCount) maxCount = newCount;
      }
    }

    const threshold = {
      keywords: 0.01,
      domains: 0.0025,
    }[category];

    const wordArr = Array.from(words.entries())
      .filter(([word, count]) => count / maxCount > threshold)
      .map(([word, count]) => [
        word,
        Math.max(12, Math.log((count / maxCount) * 500) * 10),
      ]);

    exploreCache.set(key, wordArr);
  }

  const wordArr = shuffle(exploreCache.get(key));

  const categories = {
    keywords: false,
    domains: false,
  };
  categories[category] = true;

  const types = {
    all: false,
    aframe: false,
    gltf: false,
    usdz: false,
  };
  types[type] = true;

  const userAgent = (req.get("user-agent") || "").toLowerCase();
  const isIDevice = userAgent.includes("iphone");
  const isAppleDevice = isIDevice || userAgent.includes("macintosh");

  res.render("explore", {
    words: wordArr,
    categories,
    types,
    type,
    isAppleDevice
  });
});

app.get("/search", async (req, res) => {
  const { client, db } = await connectMongo();
  const pages = await db.collection("pages");

  const userAgent = (req.get("user-agent") || "").toLowerCase();
  const isAndroid = userAgent.includes("android");
  const isIDevice = userAgent.includes("iphone");
  const isAppleDevice = isIDevice || userAgent.includes("macintosh");

  const query = req.query.q || "";
  let lowerQuery = query.toLowerCase().trim();

  const type = req.query.t || "all";

  let filter = {
    all: () => true,
    aframe: (p) => p.hasScene,
    gltf: (p) => p.models && p.models.length,
    usdz: (p) => p.iosModels && p.iosModels.length,
  }[type];
  if(!filter) filter = () => true;

  const page = parseInt(req.query.p || "0");
  const perPage = 10;

  let results = (await pages.find({}).toArray())
    .filter((p) => {
      return (
        filter(p) &&
        ((p.title || "").toLowerCase().includes(lowerQuery) ||
          (p.description || "").toLowerCase().includes(lowerQuery) ||
          (p.url || "").toLowerCase().includes(lowerQuery))
      );
    })
    .filter((p) => excludedDomains.every(d => !p.url.includes(d)))
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

  const types = {
    all: false,
    aframe: false,
    gltf: false,
    usdz: false,
  };
  types[type] = true;

  res.render("search", {
    q: req.query.q,
    type,
    types,
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
  const files = fs
    .readdirSync(path.resolve(__dirname, "..", "blog"))
    .filter((f) => f.endsWith(".md"));
  files.sort();
  const posts = files.map((file) => {
    let [date, rest] = file.split("--");
    const prettyDate = date.replace("T", " ");
    slug = rest.replace(/\.md$/, "");
    const title = slug.replaceAll("-", " ");
    return { date, prettyDate, title, slug };
  });
  res.render("blog", { posts });
});

app.get("/blog/:post", (req, res) => {
  const [date, slug] = req.params.post.split("--");
  const file = `${req.params.post}.md`;
  const filePath = path.resolve(__dirname, "..", "blog", file);
  if (fs.existsSync(filePath)) {
    res.render("post", {
      date,
      slug,
      prettyDate: date.replace("T", " "),
      title: slug.replaceAll("-", " "),
      content: md.render(fs.readFileSync(filePath, "utf8")),
    });
  } else {
    res.sendStatus(404);
  }
});

let server;
if (fs.existsSync(path.resolve(__dirname, "..", "certs", "privkey.pem"))) {
  server = https
    .createServer(
      {
        cert: fs.readFileSync(
          path.resolve(__dirname, "..", "certs", "fullchain.pem")
        ),
        key: fs.readFileSync(
          path.resolve(__dirname, "..", "certs", "privkey.pem")
        ),
      },
      app
    )
    .listen(443, () => {
      console.log("running on 443");
    });
  const redirectApp = express();
  redirectApp.get("/*", (req, res) => {
    res.redirect("https://wwxr.io" + req.originalUrl);
  });
  redirectApp.listen(80);
} else {
  server = app.listen(80, () => {
    console.log("running on 80");
  });
}

process.on("SIGTERM", () => server.close());
