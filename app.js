const express = require('express');
const database = require('./src/config/database');
const { errorHandler } = require('./src/middleware/errorHandler');

// Import routes
const booksRoutes = require('./src/routes/books.routes');
const membersRoutes = require('./src/routes/members.routes');
const transactionsRoutes = require('./src/routes/transactions.routes');
const finesRoutes = require('./src/routes/fines.routes');

const app = express();

// Middleware
app.use(express.json());

// API Routes
app.use('/books', booksRoutes);
app.use('/members', membersRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/fines', finesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Library API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Initialize Database and Start Server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('Initializing database...');
    await database.initialize();
    console.log('✓ Database initialized successfully');
    
    const server = app.listen(PORT, () => {
      console.log(`✓ Server running at http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\nSIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('✗ Unhandled Rejection:', error);
  process.exit(1);
});

startServer();