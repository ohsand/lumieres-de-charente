// Step 1 of the admin login: send the owner to GitHub to sign in.
// Needs OAUTH_GITHUB_CLIENT_ID (and OAUTH_GITHUB_CLIENT_SECRET for step 2) in Vercel › Settings › Environment Variables.
import crypto from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('GitHub login is not configured yet: OAUTH_GITHUB_CLIENT_ID is missing.');
    return;
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `https://${host}/api/callback`,
    scope: process.env.OAUTH_GITHUB_SCOPE || 'repo,user',
    state,
  });
  res.setHeader('Set-Cookie', `decap_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.writeHead(302, { Location: `https://github.com/login/oauth/authorize?${params}` });
  res.end();
}
