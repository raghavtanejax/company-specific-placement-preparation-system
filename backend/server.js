import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import http from 'http';
import { Server } from 'socket.io';
import apiRoutes from './routes/api.js';

dotenv.config();

// Use Google's public DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory room state for syncing late joiners
const roomState = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Global error handler for Express 5
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Socket.io WebRTC and Collaboration events
io.on('connection', (socket) => {
  console.log('User connected via Socket.io:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    // Send existing room state to the late joiner
    const state = roomState.get(roomId);
    if (state) {
      if (state.strokes && state.strokes.length > 0) {
        socket.emit('whiteboard-sync', state.strokes);
      }
      if (state.code !== undefined) {
        socket.emit('code-sync', state.code);
      }
    }
    
    socket.to(roomId).emit('user-joined', { socketId: socket.id, userId });
  });

  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', (incoming) => {
    io.to(incoming.target).emit('ice-candidate', incoming);
  });

  socket.on('code-change', (data) => {
    // Persist code state
    if (!roomState.has(data.roomId)) roomState.set(data.roomId, { strokes: [], code: '' });
    roomState.get(data.roomId).code = data.code;
    socket.to(data.roomId).emit('code-change', data.code);
  });

  socket.on('whiteboard-draw', (data) => {
    // Persist whiteboard strokes
    if (!roomState.has(data.roomId)) roomState.set(data.roomId, { strokes: [], code: '' });
    roomState.get(data.roomId).strokes.push(data.stroke);
    socket.to(data.roomId).emit('whiteboard-draw', data.stroke);
  });

  socket.on('whiteboard-clear', (data) => {
    // Clear persisted strokes
    if (roomState.has(data.roomId)) {
      roomState.get(data.roomId).strokes = [];
    }
    socket.to(data.roomId).emit('whiteboard-clear');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up empty rooms
    for (const [roomId, state] of roomState.entries()) {
      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room || room.size === 0) {
        roomState.delete(roomId);
      }
    }
  });
});

// Database connection - wait for connection before starting server
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log('Connected to MongoDB');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

startServer();
