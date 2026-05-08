import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";

import experiments from "./routes/experiments.js";
import coreRoi from "./routes/coreRoi.js";
import bestLayer from "./routes/bestLayer.js";
import protocolC from "./routes/protocolC.js";
import anatomy from "./routes/anatomy.js";
import isc from "./routes/isc.js";
import bootstrap from "./routes/bootstrap.js";
import qc from "./routes/qc.js";
import sweep from "./routes/sweep.js";
import figures from "./routes/figures.js";
import dashboardExport, { BRAIN_MAP_ROOT } from "./routes/dashboardExport.js";
import hf from "./routes/hf.js";
import { DATA_ROOT } from "./utils/paths.js";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

app.use(cors());
app.use(express.json());

if (!fs.existsSync(DATA_ROOT)) {
  // eslint-disable-next-line no-console
  console.warn(`[server] DATA_ROOT does not exist: ${DATA_ROOT}`);
}

// Static figures: read-only mount of DATA_ROOT under /static/figures
app.use("/static/figures", express.static(DATA_ROOT, { fallthrough: true, index: false }));
app.use("/static/brain-maps", express.static(BRAIN_MAP_ROOT, { fallthrough: true, index: false }));

app.get("/api/health", (_req, res) => res.json({ ok: true, dataRoot: DATA_ROOT }));

app.use("/api", experiments);
app.use("/api", coreRoi);
app.use("/api", bestLayer);
app.use("/api", protocolC);
app.use("/api", anatomy);
app.use("/api", isc);
app.use("/api", bootstrap);
app.use("/api", qc);
app.use("/api", sweep);
app.use("/api", figures);
app.use("/api", dashboardExport);
app.use("/api", hf);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "internal_error", message: err.message });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${PORT}  DATA_ROOT=${DATA_ROOT}`);
});
