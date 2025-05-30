﻿﻿require('rootpath')();
require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./_middleware/error-handler');

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// Root route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Backend server is running' });
});

// Basic API route for testing
app.get('/api', (req, res) => {
    res.json({ message: 'Backend API is running' });
});

// api routes
app.use('/api/accounts', require('./accounts/accounts.controller'));
app.use('/api/employees', require('./employees/employees.controller'));
app.use('/api/departments', require('./departments/departments.controller'));
app.use('/api/workflows', require('./workflows/workflows.controller'));
app.use('/api/requests', require('./requests/request.controller'));

// swagger docs route
app.use('/api/api-docs', require('./_helpers/swagger'));

// global error handler
app.use(errorHandler);

app.use((err, req, res, next) => {
    console.error('Error details:', err);
    res.status(500).json({ 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log('Server Configuration:', {
        port: port,
        nodeEnv: process.env.NODE_ENV,
        dbHost: process.env.DB_HOST,
        dbUser: process.env.DB_USER,
        dbName: process.env.DB_DATABASE
    });
    console.log('Server running at http://localhost:' + port);
});