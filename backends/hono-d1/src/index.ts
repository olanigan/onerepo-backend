import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/tasks', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM tasks ORDER BY created_at DESC'
  ).all();
  return c.json(results || []);
});

app.get('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(id).first();
  
  if (!results) {
    return c.json({ error: 'Not Found', message: `Task with id '${id}' not found` }, 404);
  }
  
  return c.json(results);
});

app.post('/tasks', async (c) => {
  const body = await c.req.json();
  
  if (!body.title) {
    return c.json({ error: 'Validation Error', details: [{ field: 'title', message: 'Title is required' }] }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(
    'INSERT INTO tasks (id, title, description, status, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.title, body.description || '', body.status || 'inbox', body.project_id || null, now, now).run();
  
  const { results } = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  return c.json(results, 201);
});

app.put('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: `Task with id '${id}' not found` }, 404);
  }
  
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE tasks SET title = ?, description = ?, status = ?, project_id = ?, updated_at = ? WHERE id = ?'
  ).bind(
    body.title ?? existing.title,
    body.description ?? existing.description,
    body.status ?? existing.status,
    body.project_id !== undefined ? body.project_id : existing.project_id,
    now,
    id
  ).run();
  
  const { results } = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  return c.json(results);
});

app.delete('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  
  const existing = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: `Task with id '${id}' not found` }, 404);
  }
  
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
  return c.body(null, 204);
});

app.get('/projects', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM projects ORDER BY created_at DESC'
  ).all();
  return c.json(results || []);
});

app.get('/projects/:id', async (c) => {
  const id = c.req.param('id');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(id).first();
  
  if (!results) {
    return c.json({ error: 'Not Found', message: `Project with id '${id}' not found` }, 404);
  }
  
  return c.json(results);
});

app.post('/projects', async (c) => {
  const body = await c.req.json();
  
  if (!body.name) {
    return c.json({ error: 'Validation Error', details: [{ field: 'name', message: 'Name is required' }] }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  await c.env.DB.prepare(
    'INSERT INTO projects (id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, body.name, body.status || 'active', now, now).run();
  
  const { results } = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  return c.json(results, 201);
});

app.put('/projects/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const existing = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: `Project with id '${id}' not found` }, 404);
  }
  
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    'UPDATE projects SET name = ?, status = ?, updated_at = ? WHERE id = ?'
  ).bind(
    body.name ?? existing.name,
    body.status ?? existing.status,
    now,
    id
  ).run();
  
  const { results } = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  return c.json(results);
});

app.delete('/projects/:id', async (c) => {
  const id = c.req.param('id');
  
  const existing = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  if (!existing) {
    return c.json({ error: 'Not Found', message: `Project with id '${id}' not found` }, 404);
  }
  
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  return c.body(null, 204);
});

app.get('/projects/:id/tasks', async (c) => {
  const projectId = c.req.param('id');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC'
  ).bind(projectId).all();
  return c.json(results || []);
});

// Benchmark endpoints
app.post('/benchmark/cpu-bound', async (c) => {
  const body = await c.req.json();
  const iterations = body.iterations || 100000;

  const startTime = Date.now();
  const startMemory = (typeof globalThis !== 'undefined' && globalThis.gc) ? 0 : 0;

  let result = 0;
  for (let i = 0; i < iterations; i++) {
    const n = 97;
    for (let j = 2; j <= Math.sqrt(n); j++) {
      if (n % j === 0) {
        result += j;
      }
    }
    const a = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    const b = [[9, 8, 7], [6, 5, 4], [3, 2, 1]];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        for (let k = 0; k < 3; k++) {
          result += a[row][k] * b[k][col];
        }
      }
    }
  }

  const endTime = Date.now();

  return c.json({
    type: 'cpu-bound',
    iterations,
    duration_ms: endTime - startTime,
    result: result % 100,
  });
});

app.post('/benchmark/io-heavy', async (c) => {
  const body = await c.req.json();
  const delay = body.delay || 50;

  const startTime = Date.now();
  const startDelay = Date.now();
  while (Date.now() - startDelay < delay) {
    // Busy wait
  }

  const { results } = await c.env.DB.prepare('SELECT * FROM tasks LIMIT 10').all();

  const endTime = Date.now();

  return c.json({
    type: 'io-heavy',
    delay_ms: delay,
    actual_duration_ms: endTime - startTime,
    tasks_retrieved: results?.length || 0,
  });
});

app.post('/benchmark/memory', async (c) => {
  const body = await c.req.json();
  const allocationMB = body.allocationMB || 50;

  const startTime = Date.now();

  const arrays: number[][] = [];
  const bytesPerMB = 1024 * 1024;
  const elementsPerMB = bytesPerMB / 8;

  for (let mb = 0; mb < Math.min(allocationMB, 10); mb++) {
    const arr = new Array(elementsPerMB);
    for (let i = 0; i < elementsPerMB; i++) {
      arr[i] = Math.random();
    }
    arrays.push(arr);
  }

  arrays.length = 0;

  const endTime = Date.now();

  return c.json({
    type: 'memory',
    allocated_mb: allocationMB,
    duration_ms: endTime - startTime,
  });
});

app.post('/benchmark/cascading', async (c) => {
  const body = await c.req.json();
  const depth = body.depth || 3;

  const startTime = Date.now();

  let result = 0;
  for (let i = 0; i < depth; i++) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO tasks (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, `Task ${i}`, '', 'inbox', now, now).run();

    const { results } = await c.env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
    if (results) result++;

    const { results: listResults } = await c.env.DB.prepare('SELECT * FROM tasks LIMIT 5').all();
  }

  const endTime = Date.now();

  return c.json({
    type: 'cascading',
    depth,
    duration_ms: endTime - startTime,
    operations_completed: result,
  });
});

app.post('/benchmark/malicious', async (c) => {
  const body = await c.req.json();
  const payloadSizeMB = body.payloadSizeMB || 10;

  const startTime = Date.now();

  const charCount = Math.min(payloadSizeMB, 5) * 1024 * 1024;
  let largeString = '';
  for (let i = 0; i < charCount; i++) {
    largeString += String.fromCharCode(65 + (i % 26));
  }

  let checksum = 0;
  for (let i = 0; i < largeString.length; i += 1000) {
    checksum += largeString.charCodeAt(i);
  }

  const endTime = Date.now();

  return c.json({
    type: 'malicious',
    payload_size_mb: payloadSizeMB,
    duration_ms: endTime - startTime,
    checksum,
  });
});

export default app;
