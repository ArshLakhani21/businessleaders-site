// Shared helpers for admin Pages Functions.
// Auth model:
//   1. ADMIN_PASSWORD env var holds the admin password (any string).
//   2. ADMIN_SECRET env var holds 32+ random bytes used to HMAC-sign
//      session cookies.
//   3. /api/admin/login validates password and Set-Cookie's a signed
//      session cookie (24h TTL).
//   4. Every other admin endpoint calls requireAdmin(request) which
//      verifies the cookie and returns 401 otherwise.
// HMAC uses Web Crypto (available on Cloudflare Workers/Pages).

const COOKIE_NAME = 'bl_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface SessionPayload {
  exp: number;
  nonce: string;
}

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  const pad = (s: string) => s + '='.repeat((4 - (s.length % 4)) % 4);
  const norm = pad(str.replace(/-/g, '+').replace(/_/g, '/'));
  const bin = atob(norm);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSession(secret: string): Promise<string> {
  const payload: SessionPayload = { exp: Date.now() + SESSION_TTL_MS, nonce: crypto.randomUUID() };
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

export async function verifySession(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  const key = await hmacKey(secret);
  const sig = b64urlDecode(sigB64);
  const ok = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(payloadB64));
  if (!ok) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64))) as SessionPayload;
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...rest] = c.trim().split('=');
      return [k, rest.join('=')];
    }),
  );
  return cookies[name] ?? null;
}

export async function requireAdmin(
  request: Request,
  env: { ADMIN_SECRET?: string },
): Promise<{ ok: true } | Response> {
  if (!env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: ADMIN_SECRET not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const token = getCookie(request, COOKIE_NAME);
  if (!token || !(await verifySession(token, env.ADMIN_SECRET))) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return { ok: true };
}

export function makeSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_TTL_MS / 1000}; Secure; HttpOnly; SameSite=Strict`;
}

export function makeLogoutCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict`;
}

export interface GitHubEnv {
  GITHUB_TOKEN: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

const DEFAULT_OWNER = 'ArshLakhani21';
const DEFAULT_REPO = 'businessleaders-site';
const DEFAULT_BRANCH = 'main';

export async function githubGetFile(
  env: GitHubEnv,
  pathInRepo: string,
): Promise<{ sha: string; content: string } | null> {
  const owner = env.GITHUB_OWNER ?? DEFAULT_OWNER;
  const repo = env.GITHUB_REPO ?? DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH ?? DEFAULT_BRANCH;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(pathInRepo)}?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'businessleaders-admin-panel',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${pathInRepo} → ${res.status}`);
  const json: any = await res.json();
  return { sha: json.sha, content: json.content };
}

export async function githubPutFile(
  env: GitHubEnv,
  pathInRepo: string,
  contentBase64: string,
  message: string,
  sha?: string,
): Promise<{ commit: string; htmlUrl: string }> {
  const owner = env.GITHUB_OWNER ?? DEFAULT_OWNER;
  const repo = env.GITHUB_REPO ?? DEFAULT_REPO;
  const branch = env.GITHUB_BRANCH ?? DEFAULT_BRANCH;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(pathInRepo)}`;
  const body: Record<string, unknown> = {
    message,
    content: contentBase64,
    branch,
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'businessleaders-admin-panel',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub PUT ${pathInRepo} → ${res.status}: ${t.slice(0, 400)}`);
  }
  const json: any = await res.json();
  return { commit: json.commit.sha, htmlUrl: json.content?.html_url ?? '' };
}

export function utf8ToBase64(input: string): string {
  return b64urlEncode(new TextEncoder().encode(input)).replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (input.length % 4)) % 4);
}

// Simpler base64 (standard alphabet, with padding) for binary uploads.
export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
