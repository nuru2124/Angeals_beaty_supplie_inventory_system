import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Security & Authentication Middleware
import { securityHeaders } from './middleware/security.js';
import { authenticateToken, requireRole } from './middleware/auth.js';

// Route Handlers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import branchesRouter from './routes/branches.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import inventoryRouter from './routes/inventory.js';
import salesRouter from './routes/sales.js';
import transfersRouter from './routes/transfers.js';
import purchasesRouter from './routes/purchases.js';
import returnsRouter from './routes/returns.js';
import stocktakesRouter from './routes/stocktakes.js';
import adjustmentsRouter from './routes/adjustments.js';
import customersRouter from './routes/customers.js';
import expensesRouter from './routes/expenses.js';
import reportsRouter from './routes/reports.js';
import notificationsRouter from './routes/notifications.js';
import auditRouter from './routes/audit.js';
import settingsRouter from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Strict Enterprise Security Headers
app.use(securityHeaders);

// 2. CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin === '*' ? true : allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-user-id', 'x-user-name']
  })
);

// 3. Body Parsing with Strict Size Limits to prevent DoS payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Structured Request Logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// 5. Public Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Angales Beauty Supplies Multi-Branch IMS',
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    currency: 'GHS',
    timestamp: new Date().toISOString()
  });
});

// 6. Public Authentication Route (Login)
app.use('/api/auth', authRouter);

// 7. Protected Operational API Routes (Token Authentication Required)
app.use('/api/users', usersRouter);
app.use('/api/branches', authenticateToken, branchesRouter);
app.use('/api/products', authenticateToken, productsRouter);
app.use('/api', authenticateToken, categoriesRouter);
app.use('/api/inventory', authenticateToken, inventoryRouter);
app.use('/api/sales', authenticateToken, salesRouter);
app.use('/api/transfers', authenticateToken, transfersRouter);
app.use('/api/purchasing', authenticateToken, purchasesRouter);
app.use('/api/returns', authenticateToken, returnsRouter);
app.use('/api/stocktakes', authenticateToken, stocktakesRouter);
app.use('/api/adjustments', authenticateToken, adjustmentsRouter);
app.use('/api/customers', authenticateToken, customersRouter);
app.use('/api/expenses', authenticateToken, requireRole(['super_admin', 'branch_manager', 'accountant']), expensesRouter);
app.use('/api/reports', authenticateToken, requireRole(['super_admin', 'branch_manager', 'accountant']), reportsRouter);
app.use('/api/notifications', authenticateToken, notificationsRouter);
app.use('/api/audit-logs', authenticateToken, requireRole(['super_admin', 'accountant']), auditRouter);
app.use('/api/settings', authenticateToken, requireRole(['super_admin']), settingsRouter);

// 8. Serve Production Frontend
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Catch-all for Single Page Application client routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexHtml = path.join(clientDist, 'index.html');
    res.sendFile(indexHtml, (err) => {
      if (err) {
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Angales Beauty IMS</title></head>
            <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f172a; color: #f8fafc;">
              <h2 style="color: #f472b6;">Angales Beauty Supplies Inventory Management System</h2>
              <p>Backend API is active on port ${PORT}.</p>
              <p>Client build available. Build client with <code>npm run build</code> if not yet compiled.</p>
              <a href="/api/health" style="color: #38bdf8;">Check API Health</a>
            </body>
          </html>
        `);
      }
    });
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌸 Angales Beauty Supplies IMS Server running on port ${PORT}`);
  console.log(`🛡️  Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🚀 API Base URL: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});

// Graceful Shutdown Handlers for Production Deployment
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed cleanly.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed cleanly.');
    process.exit(0);
  });
});

export default app;
