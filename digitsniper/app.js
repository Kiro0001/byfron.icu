const app = document.getElementById('app');

app.innerHTML = `
  <h2>Roblox Digit Username Scraper</h2>
  <label>Username Length:
    <select id="length"></select>
  </label>
  <label>Variant:
    <select id="variant">
      <option>Random</option>
      <option>Double Digit</option>
      <option>Repeating Numbers</option>
    </select>
  </label>
  <label>Scrape Mode:
    <select id="mode">
      <option>Set Amount</option>
      <option>Until Stopped</option>
    </select>
  </label>
  <label>Scrape Amount:
    <input type="number" id="amount" value="25" min="1" max="1000"/>
  </label>
  <label>Speed (sec/request):
    <input type="number" id="speed" value="0.5" min="0.1" max="2" step="0.1"/>
  </label>
  <div style="margin-top: 15px;">
    <button id="start">Start Scraping</button>
    <button id="stop" style="display:none">Stop</button>
    <span id="status"></span>
  </div>
  <h4 style="margin-top:22px;margin-bottom:7px;">Potentially Available Usernames:</h4>
  <textarea id="output" readonly></textarea>
  <button id="copy">Copy</button>
`;

for(let i=4; i<=20; i++) {
  let opt = document.createElement('option');
  opt.value = i; opt.textContent = i;
  document.getElementById('length').appendChild(opt);
}

const modeSelect = document.getElementById('mode');
const amountInput = document.getElementById('amount');
modeSelect.onchange = function() {
  amountInput.disabled = modeSelect.value === "Until Stopped";
};

let running = false;

function randomDigits(length) {
  let s = '';
  for(let i=0; i<length; i++) s += Math.floor(Math.random()*10);
  return s;
}

function doubleDigitVariant(length) {
  let digits = [];
  let doublePos = Math.floor(Math.random() * (length - 1));
  for (let i = 0; i < length; i++) {
    if (i === doublePos) {
      let d = Math.floor(Math.random() * 10).toString();
      digits.push(d);
      if (digits.length < length) digits.push(d);
      i++;
    } else {
      digits.push(Math.floor(Math.random() * 10).toString());
    }
  }
  return digits.join('').substring(0, length);
}

function repeatingNumbersVariant(length) {
  let repeatDigitsCount = Math.max(2, Math.min(4, length));
  let repeatDigit = Math.floor(Math.random() * 10).toString();
  let repeatPositions = new Set();
  while (repeatPositions.size < repeatDigitsCount) {
    let pos = Math.floor(Math.random() * length);
    repeatPositions.add(pos);
  }
  let s = '';
  for (let i = 0; i < length; i++) {
    if (repeatPositions.has(i)) {
      s += repeatDigit;
    } else {
      s += Math.floor(Math.random() * 10).toString();
    }
  }
  return s;
}

function getGenerator(variant) {
  if (variant === "Double Digit") return doubleDigitVariant;
  if (variant === "Repeating Numbers") return repeatingNumbersVariant;
  return randomDigits;
}

async function isUsernameAvailable(username) {
  // hi
  const resp = await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(username)}`);
  const data = await resp.json();
  return data.Id === undefined;
}

document.getElementById('start').onclick = async function() {
  if (running) return;
  running = true;
  document.getElementById('start').style.display = 'none';
  document.getElementById('stop').style.display = '';
  document.getElementById('output').value = '';
  document.getElementById('status').textContent = 'Starting...';

  let length = parseInt(document.getElementById('length').value);
  let variant = document.getElementById('variant').value;
  let mode = document.getElementById('mode').value;
  let amount = parseInt(document.getElementById('amount').value) || 25;
  if (mode === "Set Amount") amount = Math.max(1, Math.min(amount, 1000));
  let speed = parseFloat(document.getElementById('speed').value) || 0.5;
  speed = Math.max(0.1, Math.min(speed, 2.0));
  let generator = getGenerator(variant);
  let found = [];
  let tried = {};
  let checked = 0;

  async function tryUsername() {
    let username;
    do { username = generator(length); } while (tried[username]);
    tried[username] = true;
    document.getElementById('status').textContent = `Checking ${checked+1}: ${username}`;
    if (await isUsernameAvailable(username)) {
      found.push(username);
      document.getElementById('output').value = found.join('\n');
    }
    checked++;
  }

  if (mode === "Set Amount") {
    for (let i = 0; i < amount; i++) {
      if (!running) break;
      await tryUsername();
      await new Promise(r => setTimeout(r, speed * 1000));
    }
    document.getElementById('status').textContent = `Done! Checked ${checked} usernames.`;
    running = false;
  } else {
    while (running) {
      await tryUsername();
      await new Promise(r => setTimeout(r, speed * 1000));
    }
    document.getElementById('status').textContent = "Stopped.";
  }
  document.getElementById('start').style.display = '';
  document.getElementById('stop').style.display = 'none';
};

document.getElementById('stop').onclick = function() {
  running = false;
};

document.getElementById('copy').onclick = function() {
  const output = document.getElementById('output');
  output.select();
  output.setSelectionRange(0, 99999);
  document.execCommand('copy');
};
