# akquickchat

A lightweight real-time chat room app built with Node.js, Express, and Socket.io.

## Features

- Create and share chat rooms instantly
- Join rooms with a link or room code
- Real-time messaging with typing indicators
- Online user count and user list
- Rooms auto-expire after 24 hours
- Simple deployable Node.js backend

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Start the server

```bash
npm start
```

3. Open in your browser

```text
http://localhost:3000
```

## Project Structure

```text
quickchat/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── index.js
│   │   └── room.js
│   ├── index.html
│   └── room.html
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

## Deployment

This is a Node.js app, so it requires a server environment. GitHub Pages is not suitable for this repo.

### Recommended hosts

- Render
- Railway
- Fly.io
- Heroku

### Deploy on Render

1. Push the repo to GitHub.
2. Create a new Web Service on Render.
3. Connect your repository.
4. Set the start command to:

```bash
npm start
```

## Notes

- `node_modules` is ignored by `.gitignore`.
- The app serves static assets from `public/`.
- The server listens on `process.env.PORT || 3000`.
