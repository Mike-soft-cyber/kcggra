const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Initialize Passport
require('./config/passport');

// Import cron service
const { startCronJobs } = require('./services/cronService');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Added 5173
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


connectDB();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Added 5173
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${socket.id} joined personal room: user-${userId}`);
  });

  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`User ${socket.id} joined group: group-${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

app.use('/auth', require('./routes/authRoutes'))
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ussd', require('./routes/ussdRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/visitors', require('./routes/visitorRoutes'));
app.use('/api/guards', require('./routes/guardRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/user', require('./routes/userSettingsRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/discussions', require('./routes/discussionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 KCGGRA Portal Server Started`);
  console.log('═══════════════════════════════════════════');
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`💻 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}`);
  console.log('═══════════════════════════════════════════');
  
  // Start cron jobs (only in production)
  if (process.env.NODE_ENV === 'production') {
    console.log('⏰ Starting cron jobs...');
    startCronJobs();
    console.log('✅ Cron jobs started');
  } else {
    console.log('⏰ Cron jobs disabled in development mode');
    console.log('💡 To test cron jobs, set NODE_ENV=production or call them manually');
  }
  
});

module.exports = { app, server, io };