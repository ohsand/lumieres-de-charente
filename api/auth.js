// Admin login for the editing screen (/admin/) – password only, no GitHub account needed.
//
// Vercel › Settings › Environment Variables (Production):
//   ADMIN_PASSWORD     the password you give the owners (several allowed, separated by commas)
//   GITHUB_REPO_TOKEN  a fine-grained GitHub token limited to this repository (Contents: read & write)
//
// Decap CMS opens this page in a popup. After the right password, the page hands the
// repository token back to the editing screen, which uses it to save changes to GitHub.
import crypto from 'node:crypto';

const css = `body{font:18px/1.5 'Source Sans 3',Arial,sans-serif;background:#f7f2e8;color:#2a2723;display:grid;place-items:center;min-height:100vh;margin:0}
form{background:#fffdf8;border:1px solid #d9cfbb;padding:2rem 2.2rem;width:min(360px,90vw);box-shadow:0 10px 30px rgba(60,40,20,.08)}
h1{font:600 1.5rem Georgia,serif;margin:0 0 .3rem}p{margin:0 0 1.2rem;color:#5f5a52;font-size:.95rem}
label{display:block;font-weight:600;margin-bottom:.4rem}input{width:100%;box-sizing:border-box;font:inherit;padding:.75rem;border:1px solid #b9ad97;border-radius:2px}
button{margin-top:1rem;width:100%;font:600 1rem inherit;font-family:inherit;padding:.8rem;background:#2a2723;color:#f7f2e8;border:0;border-radius:2px;cursor:pointer}
.err{color:#a4583d;font-weight:600}`;

function loginPage(error) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Connexion · Lumières de Charente</title><style>${css}</style></head><body>
<form method="post" action="/api/auth">
  <h1>Lumières de Charente</h1>
  <p>Espace de gestion · Admin</p>
  ${error ? `<p class="err">${error}</p>` : ''}
  <label for="pw">Mot de passe / Password</label>
  <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
  <button type="submit">Se connecter / Log in</button>
</form></body></html>`;
}

function handoff(status, payload) {
  const message = JSON.stringify(`authorization:github:${status}:${JSON.stringify(payload)}`).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><p>${status === 'success' ? 'Connecté – cette fenêtre va se fermer.' : 'Erreur de connexion.'}</p>
<script>
(function () {
  if (!window.opener) return;
  function receive(e) {
    if (e.origin !== window.location.origin) return;
    window.opener.postMessage(${message}, e.origin);
    window.removeEventListener('message', receive, false);
    setTimeout(function () { window.close(); }, 500);
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', window.location.origin);
})();
</script></body></html>`;
}

function passwordOk(given) {
  const valid = (process.env.ADMIN_PASSWORD || '').split(',').map((p) => p.trim()).filter(Boolean);
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return valid.some((p) => crypto.timingSafeEqual(h(p), h(given)));
}

async function readPassword(req) {
  if (req.body && typeof req.body === 'object') return req.body.password || '';
  const raw = typeof req.body === 'string' ? req.body : await new Promise((resolve) => {
    let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => resolve(d));
  });
  return new URLSearchParams(raw).get('password') || '';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Frame-Options', 'DENY');

  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_REPO_TOKEN) {
    res.status(500).send(loginPage('La connexion n’est pas encore configurée (ADMIN_PASSWORD / GITHUB_REPO_TOKEN).'));
    return;
  }
  if (req.method !== 'POST') {
    res.status(200).send(loginPage());
    return;
  }
  const password = await readPassword(req);
  if (!password || !passwordOk(password)) {
    await new Promise((r) => setTimeout(r, 1500)); // slows down password guessing
    res.status(401).send(loginPage('Mot de passe incorrect / Wrong password'));
    return;
  }
  res.status(200).send(handoff('success', { token: process.env.GITHUB_REPO_TOKEN, provider: 'github' }));
}
