import React, { useEffect, useState } from 'react';
import './style.css';

const API_BASE = 'http://localhost:4000/api';

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [form, setForm] = useState({ name: '', email: '', coffee_id: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Load products and orders on mount
  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(data);
    } catch {
      setServerError('Failed to load products');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      const data = await res.json();
      setOrders(data);
    } catch {
      setServerError('Failed to load orders');
    }
  };

  // Validation
  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email)) {
      errs.email = 'Invalid email format';
    }
    if (!form.coffee_id || !products.find(p => p.id === Number(form.coffee_id))) {
      errs.coffee_id = 'Please select a valid coffee';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          coffee_id: Number(form.coffee_id)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Failed to save order');
        setSubmitting(false);
        return;
      }

      // Append coffee name from products list
      const coffeeName = products.find(p => p.id === Number(form.coffee_id))?.name || '';

      const newOrder = {
        ...data,
        coffee: coffeeName
      };

      setOrders([newOrder, ...orders]);
      setForm({ name: '', email: '', coffee_id: '' });
    } catch {
      setServerError('Server error, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">

      <form onSubmit={handleSubmit} noValidate>
        <h1>Coffee Shop Billing</h1>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby="name-error"
            disabled={submitting}
            required
            minLength={2}
            placeholder="Enter your name"
          />
          {errors.name && <div id="name-error" className="error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby="email-error"
            disabled={submitting}
            required
            placeholder="Enter your email"
          />
          {errors.email && <div id="email-error" className="error">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="coffee_id">Coffee</label>
          <select
            id="coffee_id"
            name="coffee_id"
            value={form.coffee_id}
            onChange={handleChange}
            aria-invalid={errors.coffee_id ? 'true' : 'false'}
            aria-describedby="coffee-error"
            disabled={submitting}
            required
          >
            <option value="">-- Select Coffee --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (${p.price.toFixed(2)})
              </option>
            ))}
          </select>
          {errors.coffee_id && <div id="coffee-error" className="error">{errors.coffee_id}</div>}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </button>

        {serverError && <div className="error server-error" role="alert">{serverError}</div>}
      </form>

      <h2>Orders</h2>
      <div className="table-container" role="region" aria-live="polite">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Name</th>
              <th>Email</th>
              <th>Coffee</th>
              <th>Price (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No orders yet</td>
              </tr>
            )}
            {orders.map(order => (
              <tr key={order.id}>
                <td data-label="Time">{new Date(order.time).toLocaleString()}</td>
                <td data-label="Name">{order.name}</td>
                <td data-label="Email">{order.email}</td>
                <td data-label="Coffee">{order.coffee}</td>
                <td data-label="Price ($)">{order.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
