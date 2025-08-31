const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Get products
app.get('/api/products', (req, res) => {
  db.all(`SELECT id, name, price FROM products`, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(rows);
  });
});

// Get orders (newest first)
app.get('/api/orders', (req, res) => {
  db.all(`
    SELECT orders.id, orders.time, orders.name, orders.email, products.name as coffee, orders.price_at_purchase as price
    FROM orders
    JOIN products ON orders.coffee_id = products.id
    ORDER BY orders.time DESC
  `, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(rows);
  });
});

// Save order
app.post('/api/orders', (req, res) => {
  const { name, email, coffee_id } = req.body;

  // Basic validation
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!coffee_id) {
    return res.status(400).json({ error: 'Coffee selection is required' });
  }

  // Get product price
  db.get(`SELECT price FROM products WHERE id = ?`, [coffee_id], (err, product) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!product) {
      return res.status(400).json({ error: 'Selected coffee product not found' });
    }

    const time = new Date().toISOString();
    const price_at_purchase = product.price;

    db.run(`
      INSERT INTO orders (time, name, email, coffee_id, price_at_purchase)
      VALUES (?, ?, ?, ?, ?)
    `, [time, name.trim(), email.trim(), coffee_id, price_at_purchase], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to save order' });
      }

      // Return the saved order with coffee name and price
      res.json({
        id: this.lastID,
        time,
        name: name.trim(),
        email: email.trim(),
        coffee: null, // will fetch below
        price: price_at_purchase
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
