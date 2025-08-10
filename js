const socket = io();

let playerIndex = null;
let gameState = null;
let selectedPlanet = null;

const lobby = document.getElementById('lobby');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const status = document.getElementById('status');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const buildBtn = document.getElementById('buildBtn');
const endTurnBtn = document.getElementById('endTurnBtn');
const info = document.getElementById('info');

joinBtn.onclick = () => {
  const room = roomInput.value.trim();
  if (!room) {
    status.textContent = 'Enter a room code';
    return;
  }
  socket.emit('joinRoom', room);
  status.textContent = 'Joining room...';
};

socket.on('roomFull', () => {
  status.textContent = 'Room is full, try another code';
});

socket.on('playerIndex', idx => {
  playerIndex = idx;
  status.textContent = 'Joined as player ' + (idx + 1);
  lobby.style.display = 'none';
  canvas.style.display = 'block';
  hud.style.display = 'block';
});

socket.on('gameState', state => {
  gameState = state;
  drawGame();
  updateInfo();
});

socket.on('playerLeft', idx => {
  status.textContent = `Player ${idx + 1} left the game`;
});

buildBtn.onclick = () => {
  if (!selectedPlanet) {
    info.textContent = 'Select your planet to build ships.';
    return;
  }
  const planet = gameState.planets.find(p => p.id === selectedPlanet);
  if (planet.owner !== playerIndex) {
    info.textContent = 'You can only build on your own planet.';
    return;
  }
  socket.emit('playerAction', { type: 'build', planetId: planet.id });
};

endTurnBtn.onclick = () => {
  socket.emit('playerAction', { type: 'endTurn' });
};

canvas.onclick = e => {
  if (!gameState) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  let clickedPlanet = null;
  for (const planet of gameState.planets) {
    const dx = planet.x - x;
    const dy = planet.y - y;
    if (dx * dx + dy * dy < 400) { // radius 20
      clickedPlanet = planet;
      break;
    }
  }
  if (clickedPlanet) {
    selectedPlanet = clickedPlanet.id;
    updateInfo();
    drawGame();
  }
};

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw planets
  for (const planet of gameState.planets) {
    ctx.beginPath();
    let color = '#888';
    if (planet.owner === 0) color = 'cyan';
    else if (planet.owner === 1) color = 'orange';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.arc(planet.x, planet.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw ships count
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(planet.ships, planet.x, planet.y + 5);

    // Highlight selected planet
    if (selectedPlanet === planet.id) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw turn indicator
  ctx.fillStyle = 'white';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Turn: Player ${gameState.turn + 1}`, 10, 580);
}

function updateInfo() {
  if (!gameState || selectedPlanet === null) {
    info.textContent = '';
    return;
  }
  const planet = gameState.planets.find(p => p.id === selectedPlanet);
  if (!planet) {
    info.textContent = '';
    return;
  }
  if (planet.owner === playerIndex) {
    info.textContent = `Your planet. Ships: ${planet.ships}`;
  } else if (planet.owner === -1) {
    info.textContent = `Neutral planet. Ships: ${planet.ships}`;
  } else {
    info.textContent = `Enemy planet. Ships: ${planet.ships}`;
  }
}
