// QuickChat home page script
const params = new URLSearchParams(location.search);
if (params.get('error') === 'notfound') {
  document.getElementById('error-banner').style.display = 'block';
}

async function createRoom() {
  const btn = document.getElementById('create-btn');
  const label = document.getElementById('create-label');
  btn.disabled = true;
  label.textContent = 'Creating…';

  try {
    const res = await fetch('/api/create-room', { method: 'POST' });
    const data = await res.json();
    window.location.href = '/room/' + data.roomId;
  } catch (e) {
    label.textContent = 'Create room';
    btn.disabled = false;
    alert('Could not create room. Is the server running?');
  }
}

function joinRoom() {
  const input = document.getElementById('room-code-input');
  const code = input.value.trim();
  if (!code) {
    input.focus();
    return;
  }

  const match = code.match(/room\/([A-Za-z0-9]+)/);
  const roomId = match ? match[1] : code;
  window.location.href = '/room/' + roomId;
}
