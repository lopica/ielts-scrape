const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const britishScrape = require("./british-coucil");
const scrapeICPDP = require("./icpdp");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Serve British Council data
  if (pathname === "/british-coucil") {
    fs.readFile(
      path.join(__dirname, "data", "british-coucil.json"),
      "utf8",
      (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ error: "Cannot read british-coucil.json" })
          );
        }
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(data);
      }
    );
    return;
  }

  // Serve ICPDP data
  if (pathname === "/icpdp") {
    fs.readFile(
      path.join(__dirname, "data", "icpdp.json"),
      "utf8",
      (err, data) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Cannot read icpdp.json" }));
        }
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(data);
      }
    );
    return;
  }

  if (pathname === "/scrape") {
    britishScrape();
    scrapeICPDP();
    res.end("ok");

    return;
  }

  // Not found
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
