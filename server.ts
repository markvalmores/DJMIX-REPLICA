import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';

async function startServer() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  const PORT = 3000;

  let activePlayers = 0;
  let totalGamersJoined = 0;

  io.on('connection', (socket) => {
    activePlayers++;
    totalGamersJoined++;
    
    // Broadcast updated stats to all clients
    io.emit('stats_update', { activePlayers, totalGamersJoined });

    socket.on('disconnect', () => {
      activePlayers--;
      io.emit('stats_update', { activePlayers, totalGamersJoined });
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activePlayers, totalGamersJoined });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
