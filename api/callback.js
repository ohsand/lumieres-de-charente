// Step 2 of the admin login: GitHub sends the owner back here; we swap the code for a token
// and hand it to the Decap CMS window that opened the login popup.
function page(status, payload) {
  const message = JSON.stringify(`authorization:github:${status}:${JSON.stringify(payload)}`).replace(/</g, '\\u003c');
  return `<!doctype html><html><body><p>${status === 'success' ? 'Signed in – you can close this window.' : 'Login failed.'}</p>
<script>
(function () {
  if (!window.opener) return;
  function receive(e) {
    if (e.origin !== window.location.origin) return;
    window.opener.postMessage(${message}, e.origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', window.location.origin);
})();
</script></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const url = new URL(req.url, 'https://placeholder');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = (req.headers.cookie || '').match(/(?:^|;\s*)decap_oauth_state=([a-f0-9]+)/)?.[1];
  res.setHeader('Set-Cookie', 'decap_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

  if (!code || !state || state !== cookie) {
    res.status(400).send(page('error', { message: 'Invalid or expired login attempt. Please try again.' }));
    return;
  }
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.OAUTH_GITHUB_CLIENT_ID,
        client_secret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const data = await r.json();
    if (!data.access_token) throw new Error(data.error_description || data.error || 'No token returned');
    res.status(200).send(page('success', { token: data.access_token, provider: 'github' }));
  } catch (err) {
    res.status(500).send(page('error', { message: String(err.message || err) }));
  }
}
