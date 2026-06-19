# Terminal Quickstart

```bash
cd afo-agent
npm install
npm run dev:lead
npm run dev:example
npm run build
```

```bash
cd afo-agent
npm run worker:dev
```

```bash
cd afo-agent
curl http://127.0.0.1:8787/status
curl http://127.0.0.1:8787/registry/tools
curl -X POST http://127.0.0.1:8787/registry/search -H 'content-type: application/json' -d '{"capability":"registry","riskMax":"read"}'
```
