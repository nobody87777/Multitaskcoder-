// MultitaskCoder - Local Development & Production Server
// Pure Node.js built-in HTTP server (zero external dependencies)

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "8080", 10);
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".mjs": "application/javascript; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".webmanifest": "application/manifest+json; charset=UTF-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=UTF-8",
  ".xml": "application/xml; charset=UTF-8"
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split("?")[0]);
  if (reqPath === "/" || reqPath === "") reqPath = "/index.html";
  if (reqPath === "/favicon.ico") reqPath = "/assets/icons/favicon-32x32.png";

  let fullPath = path.normalize(path.join(ROOT, reqPath));

  // Security check: prevent directory traversal
  if (!fullPath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing if requested URL isn't a direct static asset
      const ext = path.extname(reqPath);
      if (!ext) {
        fullPath = path.join(ROOT, "index.html");
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });

    const stream = fs.createReadStream(fullPath);
    stream.on("error", () => {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500 Internal Server Error");
    });
    stream.pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("===============================================================");
  console.log(`   MultitaskCoder Local HTTP Server is running!                `);
  console.log(`   URL: http://localhost:${PORT}/                              `);
  console.log(`   Root: ${ROOT}                                               `);
  console.log("===============================================================");
});
