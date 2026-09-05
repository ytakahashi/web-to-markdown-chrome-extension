import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import process from "node:process";
import { URL } from "node:url";

const HOST = "127.0.0.1";
const PORT = 4173;
const FIXTURES = new Map([
  ["/", ["article.html", "text/html; charset=utf-8"]],
  ["/article.html", ["article.html", "text/html; charset=utf-8"]],
  ["/non-article.html", ["non-article.html", "text/html; charset=utf-8"]],
  ["/preview.html", ["preview.html", "text/html; charset=utf-8"]],
  ["/assets/sample.svg", ["assets/sample.svg", "image/svg+xml"]],
]);
const FIXTURE_ROOT = new URL("../manual/fixtures/", import.meta.url);

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${HOST}`).pathname;
  const fixture = FIXTURES.get(pathname);

  if (!fixture) {
    response.writeHead(404, {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Not found\n");
    return;
  }

  const [relativePath, contentType] = fixture;
  const stream = createReadStream(new URL(relativePath, FIXTURE_ROOT));
  stream.once("error", (error) => {
    process.stderr.write(`Failed to read ${relativePath}: ${error.message}\n`);
    if (response.headersSent) {
      response.destroy(error);
      return;
    }

    response.writeHead(500, {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Failed to read fixture\n");
  });
  stream.once("open", () => {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
    });
    stream.pipe(response);
  });
});

server.listen(PORT, HOST, () => {
  process.stdout.write(
    `Manual fixtures: http://${HOST}:${PORT}/article.html, http://${HOST}:${PORT}/non-article.html, and http://${HOST}:${PORT}/preview.html\n`,
  );
});
