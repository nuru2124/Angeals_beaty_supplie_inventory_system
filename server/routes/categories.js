import express from 'express';
import { queryAll, run, logAudit } from '../db/database.js';

const router = express.Router();

router.get('/categories', (req, res) => {
  const categories = queryAll(`
    SELECT c.*,
           COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name ASC
  `);
  res.json(categories);
});

router.post('/categories', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const result = run(
      `INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)`,
      [name, slug, description || null]
    );
    res.status(201).json({ id: Number(result.lastInsertRowid), name, slug });
  } catch (err) {
    res.status(400).json({ error: 'Category already exists' });
  }
});

router.get('/brands', (req, res) => {
  const brands = queryAll(`
    SELECT b.*,
           COUNT(p.id) as product_count
    FROM brands b
    LEFT JOIN products p ON p.brand_id = b.id
    GROUP BY b.id
    ORDER BY b.name ASC
  `);
  res.json(brands);
});

router.post('/brands', (req, res) => {
  const { name, country_of_origin } = req.body;
  if (!name) return res.status(400).json({ error: 'Brand name is required' });

  try {
    const result = run(
      `INSERT INTO brands (name, country_of_origin) VALUES (?, ?)`,
      [name, country_of_origin || null]
    );
    res.status(201).json({ id: Number(result.lastInsertRowid), name });
  } catch (err) {
    res.status(400).json({ error: 'Brand already exists' });
  }
});

export default router;
