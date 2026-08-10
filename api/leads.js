import { fetchLeadsFromSheets } from '../server/sheets.js';

export default async function handler(req, res) {
  try {
    const fresh = req.query.fresh === '1';
    const data = await fetchLeadsFromSheets({ fresh });
    res.json(data);
  } catch (err) {
    console.error('Fatal error fetching leads:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
}
