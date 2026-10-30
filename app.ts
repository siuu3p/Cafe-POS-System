import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
// Hosts such as Render sit behind a reverse proxy; trust the first hop so
// req.ip and req.secure reflect the real client.
app.set("trust proxy", 1);
const sessionSecret = process.env["SESSION_SECRET"];

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set to sign POS sessions.");
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser(sessionSecret));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the built POS web app from the same service, so one deployment (one
// origin) covers both the UI and the API. Skipped when the build is absent,
// for example when the frontend runs on its own dev server.
const staticDir = process.env["STATIC_DIR"]
  ? path.resolve(process.env["STATIC_DIR"])
  : path.resolve(__dirname, "../../cafe-pos/dist/public");

if (existsSync(path.join(staticDir, "index.html"))) {
  logger.info({ staticDir }, "Serving POS web app");
  app.use(express.static(staticDir, { index: false, maxAge: "1h" }));
  // Single-page app fallback: any non-API GET returns index.html.
  app.get(/^(?!\/api(\/|$)).*/, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
