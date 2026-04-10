# QuickChat 💬

Link-based real-time chat rooms. No accounts required.

## Features
- Create a room with one click → get a shareable link
- Join any room via link or room code
- Real-time messaging with Socket.io
- Typing indicators
- Online user count
- Message history (last 50 messages per room)
- Rooms auto-expire after 24 hours
- SQLite persistence (messages survive server restarts)
- Responsive dark UI

## Quick Start

### 1. Install dependencies
```bash
cd quickchat
npm install
```

### 2. Start the server
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

### 3. Open in browser
```
http://localhost:3000
```

## Project Structure
```
quickchat/
├── server.js           ← Express + Socket.io backend
├── package.json
├── quickchat.db        ← SQLite database (auto-created)
└── public/
    ├── index.html      ← Home page (create / join room)
    ├── room.html       ← Chat interface
    ├── css/
    │   └── style.css
    └── js/
        └── room.js     ← Socket.io client logic
```

## How It Works

1. User clicks **Create Room** → POST `/api/create-room` → server generates 8-char ID, stores in SQLite
2. User is redirected to `/room/ROOMID`
3. Prompted for name → joins Socket.io room
4. Messages broadcast to all sockets in same room via `io.to(roomId).emit()`
5. New joiners receive last 50 messages from SQLite

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | Server port |

## Deploying to Production

### Railway / Render / Fly.io
Just push the repo — these platforms auto-detect Node.js.

### Custom VPS (with PM2)
```bash
npm install -g pm2
pm2 start server.js --name quickchat
pm2 save
```

### Notes
- SQLite file (`quickchat.db`) is created in the project root automatically.
- For multi-instance deployments, swap SQLite for PostgreSQL and use Redis adapter for Socket.io.
