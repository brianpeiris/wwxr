const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const he = require("he");

const { connectMongo } = require("./utils");

const s3Client = new S3Client({ region: "us-east-1" });

(async () => {
  const { client, db } = await connectMongo();
  const pages = db.collection("pages");

  const results = await s3Client.send(
    new ListObjectsV2Command({ Bucket: "bp-wwxr-seed-87453a02" })
  );

  let fileCount = 0;
  let pageCount = 0;
  for (const result of results.Contents) {
    if (result.Key === "_SUCCESS") continue;

    const { Body } = await s3Client.send(
      new GetObjectCommand({
        Bucket: "bp-wwxr-seed-87453a02",
        Key: result.Key,
      })
    );

    const rawOutput = await readStream(Body);
    if (!rawOutput) continue;

    fileCount++;

    const urls = rawOutput
      .trim()
      .split("\n")
      .map((r) => r.split("\t"))
      .map(([url, info]) => [url.replaceAll(/^"|"$/g, ""), JSON.parse(info)]);

    for (const [url, info] of urls) {
      await pages.insertOne({
        url,
        ...info,
        title: info.title && he.decode(info.title),
        description: info.description && he.decode(info.description),
      });
      pageCount++;
    }
  }

  client.close();

  console.log(`Ingested ${fileCount} files, ${pageCount} pages`);
})();

function readStream(stream) {
  return new Promise((resolve) => {
    stream.setEncoding("utf8");
    const chunks = [];
    stream.on("readable", () => {
      let chunk;
      while ((chunk = stream.read()) !== null) {
        chunks.push(chunk);
      }
    });
    stream.on("end", () => {
      resolve(chunks.join(""));
    });
  });
}
