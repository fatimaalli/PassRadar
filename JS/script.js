// --- Password scan ---

const form = document.getElementById('scan-form');
const passwordInput = document.getElementById('password-input');
const toggleBtn = document.getElementById('toggle-visibility');
const resultsSection = document.getElementById('results');
const breachValue = document.getElementById('breach-value');
const strengthValue = document.getElementById('strength-value');
const meterFill = document.getElementById('meter-fill');
const scanButton = form.querySelector('.scan-button');

toggleBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  toggleBtn.textContent = isPassword ? '🙈' : '👁';
});

async function sha1(message) {
  const enc = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

// k-anonymity: only the first 5 hash characters are ever sent to the API.
async function checkPwned(password) {
  const hash = await sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  if (!response.ok) throw new Error('Breach lookup failed');

  const text = await response.text();
  const match = text.split('\n').find((line) => line.startsWith(suffix));
  return match ? parseInt(match.split(':')[1], 10) : 0;
}

function calculateEntropy(password) {
  if (!password) return 0;
  const counts = {};
  for (const char of password) counts[char] = (counts[char] || 0) + 1;
  const length = password.length;
  const entropyPerChar = Object.values(counts).reduce((sum, count) => {
    const p = count / length;
    return sum - p * Math.log2(p);
  }, 0);
  return Math.round(entropyPerChar * length * 100) / 100;
}

function strengthInfo(bits) {
  if (bits < 28) return { label: 'Very weak', color: 'var(--amber)', pct: 15 };
  if (bits < 36) return { label: 'Weak', color: 'var(--amber)', pct: 35 };
  if (bits < 60) return { label: 'Reasonable', color: 'var(--teal)', pct: 60 };
  if (bits < 128) return { label: 'Strong', color: 'var(--green)', pct: 85 };
  return { label: 'Very strong', color: 'var(--green)', pct: 100 };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = passwordInput.value;
  if (!password) return;

  scanButton.disabled = true;
  scanButton.textContent = 'Scanning…';
  resultsSection.hidden = false;
  breachValue.textContent = 'Checking…';
  breachValue.className = 'result-value';

  try {
    const [pwnedCount, bits] = await Promise.all([
      checkPwned(password),
      Promise.resolve(calculateEntropy(password)),
    ]);

    if (pwnedCount > 0) {
      breachValue.textContent = `Found in ${pwnedCount.toLocaleString()} breaches`;
      breachValue.classList.add('breached');
    } else {
      breachValue.textContent = 'Not found in known breaches';
      breachValue.classList.add('safe');
    }

    const strength = strengthInfo(bits);
    strengthValue.textContent = `${strength.label} (${bits} bits)`;
    meterFill.style.width = `${strength.pct}%`;
    meterFill.style.background = strength.color;
  } catch (err) {
    breachValue.textContent = 'Could not reach the breach database — try again.';
  } finally {
    scanButton.disabled = false;
    scanButton.textContent = 'Scan password';
  }
});

// --- Password generator ---

const lengthSlider = document.getElementById('length-slider');
const lengthValueLabel = document.getElementById('length-value');
const generateButton = document.getElementById('generate-button');
const generatedPassword = document.getElementById('generated-password');
const copyButton = document.getElementById('copy-button');

lengthSlider.addEventListener('input', () => {
  lengthValueLabel.textContent = lengthSlider.value;
});

function generatePassword(length) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

generateButton.addEventListener('click', () => {
  const length = parseInt(lengthSlider.value, 10);
  generatedPassword.textContent = generatePassword(length);
});

copyButton.addEventListener('click', async () => {
  const text = generatedPassword.textContent;
  if (!text || text === 'Click generate to create one') return;
  await navigator.clipboard.writeText(text);
  copyButton.textContent = 'Copied!';
  setTimeout(() => {
    copyButton.textContent = 'Copy';
  }, 1500);
});
