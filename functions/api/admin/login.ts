import { signSession, makeSessionCookie } from './_lib';

interface Env {
  ADMIN_PASSWORD?: string;
  ADMIN_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (!env.ADMIN_PASSWORD || !env.ADMIN_SECRET) {
    return new Response(
      JSON.stringify({
        error:
          'Server misconfigured: set ADMIN_PASSWORD and ADMIN_SECRET in Cloudflare Pages → Settings → Environment variables, then redeploy.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    // Constant-ish delay to discourage brute force.
    await new Promise((r) => setTimeout(r, 600));
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await signSession(env.ADMIN_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': makeSessionCookie(token),
    },
  });
};
