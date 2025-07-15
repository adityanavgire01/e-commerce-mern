// Import required modules
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
require('dotenv').config();

// Connect to database
connectDB();

// Create Express application instance
const app = express();

// Define port
const PORT = process.env.PORT || 5000;

// Middleware Setup
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'E-commerce API is running!',
        timestamp: new Date().toISOString(),
        database: 'Connected to MongoDB'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Server is healthy',
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`📂 Category endpoints: http://localhost:${PORT}/api/categories`);
    console.log(`🛍️ Product endpoints: http://localhost:${PORT}/api/products`);
});

