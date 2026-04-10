/* ── QuickChat room.js ─────────────────────────────────────────────────────── */

const roomId = location.pathname.split('/room/')[1];
let myUsername = '';
let socket = null;
let typingTimer = null;
let isTyping = false;
let onlineUsers = new Set();

// ── DOM refs ──────────────────────────────────────────────────────────────────
const joinOverlay   = document.getElementById('join-overlay');
const chatApp       = document.getElementById('chat-app');
const nameInput     = document.getElementById('name-input');
const overlayError  = document.getElementById('overlay-error');
const messagesEl    = document.getElementById('messages');
const msgInput      = document.getElementById('msg-input');
const typingBar     = document.getElementById('typing-bar');

function setViewportHeight() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// ── Init ──────────────────────────────────────────────────────────────────────
document.getElementById('overlay-room-id').textContent = roomId;
document.getElementById('header-room-id').textContent  = roomId;
document.title = `Room ${roomId} · QuickChat`;

// Set link display in sidebar
const linkDisplay = document.getElementById('link-display');
if (linkDisplay) linkDisplay.textContent = location.href;

// Restore username from session
const savedName = sessionStorage.getItem('qc-username');
if (savedName) nameInput.value = savedName;

// ── Sidebar mobile helpers ────────────────────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-backdrop').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('show');
  document.body.style.overflow = '';
}

// ── Users list ────────────────────────────────────────────────────────────────
function renderUsers() {
  const list = document.getElementById('users-list');
  const badge = document.getElementById('online-badge');
  const headerCount = document.getElementById('header-count');
  if (!list) return;

  const count = onlineUsers.size;
  if (badge) badge.textContent = count;
  if (headerCount) headerCount.textContent = count + ' online';

  list.innerHTML = '';
  onlineUsers.forEach(name => {
    const div = document.createElement('div');
    div.className = 'user-item' + (name === myUsername ? ' user-me' : '');

    const av = document.createElement('div');
    av.className = 'user-avatar';
    av.textContent = name.charAt(0).toUpperCase();
    av.style.background = avatarColor(name);

    const nm = document.createElement('span');
    nm.className = 'user-name';
    nm.textContent = name + (name === myUsername ? ' (you)' : '');

    const dot = document.createElement('div');
    dot.className = 'user-online-dot';

    div.appendChild(av);
    div.appendChild(nm);
    div.appendChild(dot);
    list.appendChild(div);
  });
}

// ── Join ──────────────────────────────────────────────────────────────────────
function joinChat() {
  const name = nameInput.value.trim();
  if (!name) {
    showOverlayError('Please enter your name.');
    nameInput.focus();
    return;
  }
  myUsername = name;
  sessionStorage.setItem('qc-username', name);

  onlineUsers.add(name);

  socket = io();
  bindSocketEvents();
  socket.emit('join-room', { roomId, username: name });

  joinOverlay.style.display = 'none';
  chatApp.style.display     = 'flex';
  renderUsers();
  msgInput.focus();
}

function showOverlayError(msg) {
  overlayError.textContent = msg;
  overlayError.style.display = 'block';
}

// ── Socket events ─────────────────────────────────────────────────────────────
function bindSocketEvents() {

  socket.on('error', ({ message }) => {
    joinOverlay.style.display = 'flex';
    chatApp.style.display     = 'none';
    showOverlayError(message);
  });

  socket.on('message-history', (messages) => {
    messages.forEach(m => appendMessage(m.username, m.text, m.sent_at, false));
    scrollToBottom();
  });

  socket.on('new-message', ({ username, text, sent_at }) => {
    const isMe = username === myUsername;
    appendMessage(username, text, sent_at, isMe);
    scrollToBottom();
  });

  socket.on('user-joined', ({ username }) => {
    onlineUsers.add(username);
    renderUsers();
    appendNotice(`${username} joined the room`);
  });

  socket.on('user-left', ({ username }) => {
    onlineUsers.delete(username);
    renderUsers();
    appendNotice(`${username} left`);
  });

  socket.on('user-count', (count) => {
    // count is authoritative; we rely on user-joined/left for names
    const badge = document.getElementById('online-badge');
    if (badge) badge.textContent = count;
    const hc = document.getElementById('header-count');
    if (hc) hc.textContent = count + ' online';
  });

  // Server can send full user list on join
  socket.on('user-list', (users) => {
    onlineUsers = new Set(users);
    renderUsers();
  });

  socket.on('typing', ({ username }) => {
    typingBar.textContent = `${username} is typing…`;
    clearTimeout(typingBar._clear);
    typingBar._clear = setTimeout(() => { typingBar.textContent = ''; }, 3000);
  });

  socket.on('stop-typing', () => {
    typingBar.textContent = '';
  });

  socket.on('disconnect', () => {
    appendNotice('Connection lost. Reconnecting…');
  });

  socket.on('reconnect', () => {
    appendNotice('Reconnected.');
    socket.emit('join-room', { roomId, username: myUsername });
  });
}

// ── Send message ──────────────────────────────────────────────────────────────
function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || !socket) return;
  socket.emit('send-message', { roomId, username: myUsername, text });
  msgInput.value = '';
  autoResize(msgInput);
  stopTyping();
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function handleInput(el) {
  autoResize(el);
  emitTyping();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 150) + 'px';
}

// ── Typing indicators ─────────────────────────────────────────────────────────
function emitTyping() {
  if (!isTyping && socket) {
    isTyping = true;
    socket.emit('typing', { roomId, username: myUsername });
  }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(stopTyping, 2000);
}

function stopTyping() {
  if (isTyping && socket) {
    isTyping = false;
    socket.emit('stop-typing', { roomId });
  }
  clearTimeout(typingTimer);
}

// ── Message rendering ─────────────────────────────────────────────────────────
function appendMessage(username, text, timestamp, isMe) {
  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap ' + (isMe ? 'msg-me' : 'msg-other');

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = username.charAt(0).toUpperCase();
  avatar.style.background = avatarColor(username);

  const body = document.createElement('div');
  body.className = 'msg-body';

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.innerHTML = `<span class="msg-name">${escHtml(username)}</span><span class="msg-time">${formatTime(timestamp)}</span>`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = escHtml(text).replace(/\n/g, '<br/>');

  body.appendChild(meta);
  body.appendChild(bubble);

  if (isMe) {
    wrap.appendChild(body);
    wrap.appendChild(avatar);
  } else {
    wrap.appendChild(avatar);
    wrap.appendChild(body);
  }

  messagesEl.appendChild(wrap);
}

function appendNotice(text) {
  const el = document.createElement('div');
  el.className = 'msg-notice';
  el.textContent = text;
  messagesEl.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatTime(unixSec) {
  const d = new Date(unixSec * 1000);
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + String(m).padStart(2,'0') + ' ' + ampm;
}

const COLOR_PALETTE = [
  '#7C3AED','#DB2777','#D97706','#059669','#2563EB',
  '#DC2626','#0891B2','#7C3AED','#65A30D','#9333EA'
];
function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

// ── Copy link ─────────────────────────────────────────────────────────────────
function copyLink() {
  navigator.clipboard.writeText(location.href).then(() => {
    const hBtn = document.querySelector('.header-copy-btn');
    if (hBtn) { hBtn.textContent = 'Copied!'; setTimeout(() => hBtn.textContent = 'Copy link', 2000); }
    const label = document.getElementById('copy-btn-label');
    const sBtn  = document.getElementById('copy-link-btn');
    if (label) { label.textContent = 'Copied!'; }
    if (sBtn)  { sBtn.classList.add('copied'); }
    setTimeout(() => {
      if (label) label.textContent = 'Copy link';
      if (sBtn)  sBtn.classList.remove('copied');
    }, 2000);
  });
}
