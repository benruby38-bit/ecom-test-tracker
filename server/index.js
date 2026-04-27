const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { client, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Products ──────────────────────────────────────────────────────────────────

app.get('/api/products', async (req, res) => {
  try {
    const result = await client.execute(`
      SELECT
        p.id, p.name, p.created_at,
        COUNT(DISTINCT t.id) AS test_count,
        COALESCE(SUM(dl.ad_spend), 0) AS total_spend,
        COALESCE(SUM(dl.cogs), 0) AS total_cogs,
        COALESCE(SUM(dl.revenue), 0) AS total_revenue,
        COALESCE(SUM(dl.revenue - dl.ad_spend - dl.cogs), 0) AS total_profit
      FROM products p
      LEFT JOIN tests t ON t.product_id = p.id
      LEFT JOIN daily_logs dl ON dl.test_id = t.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const result = await client.execute({
      sql: 'INSERT INTO products (name) VALUES (?) RETURNING *',
      args: [name.trim()],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await client.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

app.get('/api/products/:productId/tests', async (req, res) => {
  try {
    const result = await client.execute({
      sql: `
        SELECT
          t.id, t.name, t.product_id, t.created_at,
          COALESCE(SUM(dl.ad_spend), 0) AS total_spend,
          COALESCE(SUM(dl.cogs), 0) AS total_cogs,
          COALESCE(SUM(dl.revenue), 0) AS total_revenue,
          COALESCE(SUM(dl.revenue - dl.ad_spend - dl.cogs), 0) AS total_profit,
          CASE WHEN SUM(dl.ad_spend) > 0
            THEN ROUND(SUM(dl.revenue) / SUM(dl.ad_spend), 2)
            ELSE 0 END AS roas,
          COUNT(dl.id) AS log_count
        FROM tests t
        LEFT JOIN daily_logs dl ON dl.test_id = t.id
        WHERE t.product_id = ?
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `,
      args: [req.params.productId],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/:productId/tests', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  try {
    const result = await client.execute({
      sql: 'INSERT INTO tests (product_id, name) VALUES (?, ?) RETURNING *',
      args: [req.params.productId, name.trim()],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tests/:id', async (req, res) => {
  try {
    await client.execute({ sql: 'DELETE FROM tests WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Daily Logs ────────────────────────────────────────────────────────────────

app.get('/api/tests/:testId/logs', async (req, res) => {
  try {
    const [logsResult, testResult] = await Promise.all([
      client.execute({
        sql: 'SELECT * FROM daily_logs WHERE test_id = ? ORDER BY date DESC, created_at DESC',
        args: [req.params.testId],
      }),
      client.execute({
        sql: `
          SELECT
            t.id, t.name, t.product_id,
            p.name AS product_name,
            COALESCE(SUM(dl.ad_spend), 0) AS total_spend,
            COALESCE(SUM(dl.cogs), 0) AS total_cogs,
            COALESCE(SUM(dl.revenue), 0) AS total_revenue,
            COALESCE(SUM(dl.revenue - dl.ad_spend - dl.cogs), 0) AS total_profit,
            CASE WHEN SUM(dl.ad_spend) > 0
              THEN ROUND(SUM(dl.revenue) / SUM(dl.ad_spend), 2)
              ELSE 0 END AS roas
          FROM tests t
          JOIN products p ON p.id = t.product_id
          LEFT JOIN daily_logs dl ON dl.test_id = t.id
          WHERE t.id = ?
          GROUP BY t.id
        `,
        args: [req.params.testId],
      }),
    ]);
    res.json({ test: testResult.rows[0], logs: logsResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tests/:testId/logs', async (req, res) => {
  const { date, ad_spend, cogs, revenue } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });
  try {
    const result = await client.execute({
      sql: 'INSERT INTO daily_logs (test_id, date, ad_spend, cogs, revenue) VALUES (?, ?, ?, ?, ?) RETURNING *',
      args: [req.params.testId, date, Number(ad_spend) || 0, Number(cogs) || 0, Number(revenue) || 0],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/logs/:id', async (req, res) => {
  const { date, ad_spend, cogs, revenue } = req.body;
  try {
    const result = await client.execute({
      sql: 'UPDATE daily_logs SET date = ?, ad_spend = ?, cogs = ?, revenue = ? WHERE id = ? RETURNING *',
      args: [date, Number(ad_spend) || 0, Number(cogs) || 0, Number(revenue) || 0, req.params.id],
    });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/logs/:id', async (req, res) => {
  try {
    await client.execute({ sql: 'DELETE FROM daily_logs WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Static (production) ───────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
