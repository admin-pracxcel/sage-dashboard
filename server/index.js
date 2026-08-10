import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fetchLeadsFromSheets } from './sheets.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/leads', async (req, res) => {
  try {
    const fresh = req.query.fresh === '1';
    const data = await fetchLeadsFromSheets({ fresh });
    res.json(data);
  } catch (err) {
    console.error('Fatal error fetching leads:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
