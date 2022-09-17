const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const he = require("he");

const { connectMongo } = require("./utils");

const s3Bucket = "your-output-bucket";
const s3Client = new S3Client({ region: "us-east-1" });

(async () => {
  const { client, db } = await connectMongo();
  const pages = db.collection("pages");

  let continuationToken = null;

  let fileCount = 0;
  let pageCount = 0;

  do {

    const params = { Bucket: s3Bucket };
    if (continuationToken) params.ContinuationToken = continuationToken;
    const results = await s3Client.send(new ListObjectsV2Command(params));

    for (const result of results.Contents) {
      if (result.Key.startsWith("tmp/")) continue;
      if (result.Key.endsWith("_SUCCESS")) continue;

      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: s3Bucket,
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
        .filter(([url, info]) => {
          if (/[^\x00-\x7F]/.test(url)) return false;
          if (!info || info.trim().length === 0) return false
          let validJson = true;
          try {
            JSON.parse(info)
          } catch(e) {
            validJson = false;
          }
          return validJson;
        })
        .map(([url, info]) => [url.replaceAll(/^"|"$/g, ""), JSON.parse(info)])
        .map(([url, info]) => ({
          url,
          ...info,
          title: info.title && he.decode(info.title),
          description: info.description && he.decode(info.description),
        }));

      if (urls.length) {
        await pages.insertMany(urls);
        pageCount += urls.length;
      }

      console.log(result.Key, urls.length);
    }

    continuationToken = results.NextContinuationToken;

  } while(continuationToken);

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
