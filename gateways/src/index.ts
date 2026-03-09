import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  ENVIRONMENT: 'local' | 'cloud';
  BACKEND_HONO_D1_URL: string;
  BACKEND_BUN_SQLITE_URL?: string;
};

interface Backend {
  id: string;
  name: string;
  url: string;
  type: 'local' | 'cloud';
  healthEndpoint: string;
}

interface BackendRegistry {
  getBackend(id: string): Backend | null;
  listBackends(): Backend[];
}

function createRegistry(env: Env): BackendRegistry {
  const backendUrl = env.BACKEND_HONO_D1_URL || 'https://hono-d1-backend.salalite.workers.dev';
  
  const backends: Map<string, Backend> = new Map([
    ['hono-d1', {
      id: 'hono-d1',
      name: 'Hono + D1 (Cloud)',
      url: backendUrl,
      type: 'cloud',
      healthEndpoint: '/health'
    }]
  ]);

  if (env.BACKEND_BUN_SQLITE_URL) {
    backends.set('bun-sqlite', {
      id: 'bun-sqlite',
      name: 'Bun + SQLite (Local)',
      url: env.BACKEND_BUN_SQLITE_URL,
      type: 'local',
      healthEndpoint: '/health'
    });
  }

  return {
    getBackend(id: string) {
      return backends.get(id) || null;
    },
    listBackends() {
      return Array.from(backends.values());
    }
  };
}

async function proxyRequest(
  request: Request,
  backend: Backend,
  timeout = 30000
): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = `${backend.url}${url.pathname}${url.search}`;
  
  console.log(`Proxying to: ${targetUrl}`);
  console.log(`Backend: ${backend.id} - ${backend.url}`);
  
  try {
    console.log(`Fetching from ${targetUrl}...`);
    console.log(`Method: ${request.method}`);
    
    const newHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-forwarded-for': request.headers.get('cf-connecting-ip') || 'unknown',
      'x-gateway-version': '1.0.0',
    };
    
    const backendHeader = request.headers.get('x-backend');
    if (backendHeader) {
      newHeaders['x-backend'] = backendHeader;
    }
    
    console.log(`Headers: ${JSON.stringify(newHeaders)}`);
    const requestBody = request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body;
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body: requestBody,
      signal: AbortSignal.timeout(timeout)
    });
    console.log(`Response status: ${response.status}`);
    const text = await response.text();
    console.log(`Response body (first 200 chars): ${text.substring(0, 200)}`);

    const corsHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-backend, x-backend-location'
    });

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders
    });
  } catch (error) {
    console.error(`Proxy error: ${error}`);
    return new Response(
      JSON.stringify({ error: 'Backend unavailable', message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'x-backend', 'x-backend-location']
}));

app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'local'
  });
});

app.get('/backends', (c) => {
  const registry = createRegistry(c.env);
  return c.json({ backends: registry.listBackends() });
});

app.all('*', async (c) => {
  const registry = createRegistry(c.env);
  const backendId = c.req.header('x-backend') || 'hono-d1';
  
  const backend = registry.getBackend(backendId);
  if (!backend) {
    return c.json(
      { error: 'Unknown backend', available: registry.listBackends().map(b => b.id) },
      400
    );
  }

  return proxyRequest(c.req.raw, backend);
});

export default app;
