# Neural Encoding Dashboard (Node)

Production-grade React + Express replica of the Streamlit dashboard.

## Quickstart

```bash
cp .env.example .env   # set DATA_ROOT=d:/csai2/hf
npm install
npm run dev            # server on :4000, client on :5173
```

Client proxies `/api/*` and `/static/*` to the server.

## Stack

- React 18 + Vite + Tailwind CSS + shadcn-style primitives + Framer Motion
- Plotly.js for charts, AG Grid Community for tables
- Express read-only API over local CSV/JSON
- React Query for client cache, mtime-keyed in-memory cache on server
