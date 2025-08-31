const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'coffee-shop.db'));

// Initialize DB schema and seed products
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      coffee_id INTEGER NOT NULL,
      price_at_purchase REAL NOT NULL,
      FOREIGN KEY(coffee_id) REFERENCES products(id)
    )
  `);

  // Insert two coffee products if not exist
  db.get(`SELECT COUNT(*) as count FROM products`, (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO products (name, price) VALUES (?, ?)`);
      stmt.run('Americano', 150.00);
      stmt.run('Latte', 200.00);
      stmt.finalize();
    }
  });
});

module.exports = db;
