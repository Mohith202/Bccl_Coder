# Neural Encoding Dashboard (Node)

Production-grade React + Express replica of the Streamlit dashboard.

## Quickstart

```bash
cp .env.example .env   # set DATA_ROOT=d:/csai2/hf
npm install
npm run dev            # server on :4000, client on :5173
```

Client proxies `/api/*` and `/static/*` to the server.

## GitHub Pages

The GitHub Pages deployment publishes the React client only. The Express API is not deployable on GitHub Pages, so you must host the server separately and point the client at it with `VITE_API_BASE_URL`.

### What changed for Pages

- The client now uses hash routing, so direct refreshes on Pages do not 404.
- Built assets use relative paths, so the app works under a repository subpath.
- API requests can target an external backend through `VITE_API_BASE_URL`.

### Required repository variable

Create a GitHub Actions repository variable named `VITE_API_BASE_URL` with the public base URL of your deployed API, for example:

```text
https://your-api-host.example.com
```

### Deploy flow

1. Push the `TEAM-9` changes to your default branch.
2. In GitHub, enable Pages with `GitHub Actions` as the source.
3. Add the `VITE_API_BASE_URL` repository variable.
4. Let the `Deploy GitHub Pages` workflow publish the client.

If you do not provide `VITE_API_BASE_URL`, the UI will deploy but live data requests will still point at the GitHub Pages origin and fail.

## Stack

- React 18 + Vite + Tailwind CSS + shadcn-style primitives + Framer Motion
- Plotly.js for charts, AG Grid Community for tables
- Express read-only API over local CSV/JSON
- React Query for client cache, mtime-keyed in-memory cache on server
