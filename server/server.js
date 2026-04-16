const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport');
const cookieParser = require('cookie-parser');

dotenv.config();

const connectDB = require('./config/db');
require('./config/passport');
const { startCronJobs } = require('./services/cronService');

const app = express();
const server = http.createServer(app);

// ── Allowed frontend origins ──────────────────────────────
// ⚠️  'https://kcggra-production.up.railway.app' was WRONG here —
//     that is the BACKEND URL, not the frontend.
//     Set FRONTEND_URL in Railway to your actual frontend URL, e.g.:
//       http://localhost:5173          (local dev)
//       https://kcggra.vercel.app      (production)
//
// You can add a second URL as FRONTEND_URL_2 if needed.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
].filter(Boolean);

console.log('✅ CORS allowed origins:', allowedOrigins);

// ── Socket.io ─────────────────────────────────────────────
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Socket CORS blocked: ' + origin));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

connectDB();

// ── CORS middleware ───────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, Railway health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Log so you can see exactly what origin is being blocked
    console.warn('❌ CORS blocked request from origin:', origin);
    console.warn('   Add it to FRONTEND_URL in Railway env vars');
    callback(new Error('CORS policy: origin not allowed — ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ── Socket events ─────────────────────────────────────────
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

// ── Routes ────────────────────────────────────────────────
app.use('/auth',                    require('./routes/authRoutes'));
app.use('/api/auth',                require('./routes/authRoutes'));
app.use('/api/ussd',                require('./routes/ussdRoutes'));
app.use('/api/incidents',           require('./routes/incidentRoutes'));
app.use('/api/payments',            require('./routes/paymentRoutes'));
app.use('/api/visitors',            require('./routes/visitorRoutes'));
app.use('/api/guards',              require('./routes/guardRoutes'));
app.use('/api/groups',              require('./routes/groupRoutes'));
app.use('/api/announcements',       require('./routes/announcementRoutes'));
app.use('/api/events',              require('./routes/eventRoutes'));
app.use('/api/user',                require('./routes/userSettingsRoutes'));
app.use('/api/projects',            require('./routes/projectRoutes'));
app.use('/api/discussions',         require('./routes/discussionRoutes'));
app.use('/api/admin',               require('./routes/adminRoutes'));
app.use('/api/admin/subscriptions', require('./routes/adminSubscriptionRoutes'));

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 KCGGRA Portal Server Started`);
  console.log('═══════════════════════════════════════════');
  console.log(`📡 Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Port:         ${PORT}`);
  console.log(`🖥️  Frontend URL: ${process.env.FRONTEND_URL || '⚠️  NOT SET'}`);
  console.log(`📊 Database:     ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}`);
  console.log('═══════════════════════════════════════════');

  if (process.env.NODE_ENV === 'production') {
    console.log('⏰ Starting cron jobs...');
    startCronJobs();
    console.log('✅ Cron jobs started');
  } else {
    console.log('⏰ Cron jobs disabled in development mode');
  }
});

module.exports = { app, server, io };