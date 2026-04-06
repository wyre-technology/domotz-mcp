import { createServer as createHttpServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { logger } from './utils/logger.js';

const port = parseInt(process.env.MCP_HTTP_PORT || '8080', 10);
const host = process.env.MCP_HTTP_HOST || '0.0.0.0';
const isGatewayMode = process.env.AUTH_MODE === 'gateway';

const httpServer = createHttpServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health') {
    const apiKey = process.env.DOMOTZ_API_KEY;
    const ok = !!apiKey;
    res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: ok ? 'ok' : 'degraded', credentials: { configured: ok } }));
    return;
  }

  if (url.pathname !== '/mcp') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', endpoints: ['/mcp', '/health'] }));
    return;
  }

  // Gateway mode: inject credentials from headers
  if (isGatewayMode) {
    const apiKey = req.headers['x-domotz-api-key'] as string;
    const region = req.headers['x-domotz-region'] as string;
    if (!apiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing X-Domotz-API-Key header' }));
      return;
    }
    process.env.DOMOTZ_API_KEY = apiKey;
    if (region) process.env.DOMOTZ_REGION = region;
  }

  // Create fresh server + transport per request (stateless)
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res);
});

httpServer.listen(port, host, () => {
  logger.info(`Domotz MCP HTTP server listening on ${host}:${port}`);
});
