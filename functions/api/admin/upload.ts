import { requireAdmin, githubPutFile } from './_lib';
import type { GitHubEnv } from './_lib';

interface Env extends GitHubEnv {
  ADMIN_SECRET?: string;
}

const EXT_FOR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  let body: { slug?: string; filename?: string; contentBase64?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { slug, filename, contentBase64 } = body;
  if (!slug || !filename || !contentBase64) {
    return new Response(JSON.stringify({ error: 'slug, filename, contentBase64 all required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(slug)) {
    return new Response(JSON.stringify({ error: 'slug must be kebab-case, ≤60 chars' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Pick extension from filename, falling back to .jpg.
  const m = filename.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
  const ext = m ? (m[1] === 'jpeg' ? 'jpg' : m[1]) : 'jpg';
  const pathInRepo = `public/images/articles/${slug}.${ext}`;

  if (!env.GITHUB_TOKEN) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN env var missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const result = await githubPutFile(
      env,
      pathInRepo,
      contentBase64,
      `admin: upload image for ${slug}`,
    );
    return new Response(
      JSON.stringify({ ok: true, path: `/images/articles/${slug}.${ext}`, commit: result.commit }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
