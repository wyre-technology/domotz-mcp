import { createServer as createHttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createServer } from './server.js';
import { logger } from './utils/logger.js';

const transports: Record<string, StreamableHTTPServerTransport> = {};

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

  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (req.method === 'POST') {
    const chunks: Buffer[] = [];
    await new Promise((resolve, reject) => {
      req.on('data', c => chunks.push(c));
      req.on('end', resolve);
      req.on('error', reject);
    });
    const body = Buffer.concat(chunks).toString();
    const parsed = JSON.parse(body);

    if (sessionId && transports[sessionId]) {
      await transports[sessionId].handleRequest(req, res, parsed);
      return;
    }

    if (!sessionId && isInitializeRequest(parsed)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (sid) => { transports[sid] = transport; },
      });
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) delete transports[sid];
      };
      const server = createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, parsed);
      return;
    }

    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message: 'Bad Request' }, id: null }));
    return;
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
    if (!sessionId || !transports[sessionId]) {
      res.writeHead(400).end('Invalid session');
      return;
    }
    await transports[sessionId].handleRequest(req, res);
    return;
  }

  res.writeHead(405).end();
});

httpServer.listen(port, host, () => {
  logger.info(`Domotz MCP HTTP server listening on ${host}:${port}`);
});
