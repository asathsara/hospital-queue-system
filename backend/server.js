const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Static
app.use('/doctor', express.static(path.join(__dirname, '../frontend/doctor')));
app.use('/display', express.static(path.join(__dirname, '../frontend/display')));
app.use('/static', express.static(path.join(__dirname, '../frontend/shared')));

// DB
connectDB();

// Socket.IO
setupSocket(server);

// Start server
server.listen(3000, () => console.log('🚀 Server running on port 3000'));
