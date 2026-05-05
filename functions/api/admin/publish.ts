import { requireAdmin, githubPutFile, githubGetFile } from './_lib';
import type { GitHubEnv } from './_lib';

interface Env extends GitHubEnv {
  ADMIN_SECRET?: string;
}

const VALID_BEATS = new Set([
  'business', 'finance', 'entertainment', 'lifestyle', 'health',
  'travel', 'international', 'sports', 'astro',
]);

interface PublishBody {
  title: string;
  slug: string;
  beat: string;
  authorName?: string;
  metaDescription: string;
  tags?: string[];
  imagePath: string;
  imageAlt: string;
  photographer?: string;
  imageSource?: string;
  body: string;
  wordCount?: number;
  auditScore?: number;
  runId?: string;
}

function authorSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function todayISTDateFolder(): string {
  // Assemble a YYYY-MM-DD string in IST (UTC+5:30) — matches engine.
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffsetMs);
  return ist.toISOString().slice(0, 10);
}

function escapeYaml(s: string): string {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function frontmatterFor(b: PublishBody): string {
  const author = {
    name: b.authorName?.trim() || 'Arsh Lakhani',
    slug: authorSlug(b.authorName?.trim() || 'arsh-lakhani'),
  };
  const tags = (b.tags ?? []).filter(Boolean);
  const wc =
    typeof b.wordCount === 'number' && b.wordCount > 0
      ? b.wordCount
      : (b.body.match(/\S+/g) || []).length;
  const audit = typeof b.auditScore === 'number' ? b.auditScore : 7;
  const lines = [
    `title: "${escapeYaml(b.title)}"`,
    `slug: ${b.slug}`,
    `beat: ${b.beat}`,
    `publishedAt: ${new Date().toISOString()}`,
    `author:`,
    `  name: "${escapeYaml(author.name)}"`,
    `  slug: ${author.slug}`,
    // Engine writes a sources array; we keep one synthetic entry so the
    // Zod schema (min 1) passes. The article body itself never names
    // any publication; this is purely metadata for engine analytics.
    `sources:`,
    `  - id: manual-admin`,
    `    name: "Business Leader Editorial"`,
    `    url: https://businessleaders.in/about/`,
    `    language: en`,
    `image:`,
    `  path: "${escapeYaml(b.imagePath)}"`,
    `  alt: "${escapeYaml(b.imageAlt)}"`,
    `  photographer: "${escapeYaml(b.photographer ?? 'Business Leader')}"`,
    `  source: ${b.imageSource && ['pexels', 'unsplash', 'fallback'].includes(b.imageSource) ? b.imageSource : 'fallback'}`,
    `metaDescription: "${escapeYaml(b.metaDescription)}"`,
    `tags:`,
    ...tags.map((t) => `  - "${escapeYaml(t)}"`),
    `wordCount: ${wc}`,
    `auditScore: ${audit}`,
    `runId: ${b.runId || 'manual'}`,
  ];
  if (tags.length === 0) {
    // Zod min(1) — add a default tag if none provided.
    const idx = lines.findIndex((l) => l === 'tags:');
    lines.splice(idx + 1, 0, '  - editorial');
  }
  return lines.join('\n');
}

function validate(b: PublishBody): string | null {
  if (!b.title || b.title.length < 20 || b.title.length > 100) return 'title must be 20–100 chars';
  if (!b.slug || !/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(b.slug)) return 'slug must be kebab-case ≤60 chars';
  if (!b.beat || !VALID_BEATS.has(b.beat)) return 'beat must be one of the 9 valid slugs';
  if (!b.metaDescription || b.metaDescription.length < 120 || b.metaDescription.length > 170) return 'metaDescription must be 120–170 chars';
  if (!b.body || b.body.trim().length < 100) return 'body too short';
  if (!b.imagePath) return 'imagePath required';
  if (!b.imageAlt) return 'imageAlt required';
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const err = validate(body);
  if (err) {
    return new Response(JSON.stringify({ error: err }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.GITHUB_TOKEN) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN env var missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const dateFolder = todayISTDateFolder();
  const filename = `${dateFolder}-${body.slug}.md`;
  const pathInRepo = `src/content/articles/${filename}`;

  // Avoid clobbering an existing slug — the engine often writes here.
  const existing = await githubGetFile(env, pathInRepo).catch(() => null);
  if (existing) {
    return new Response(
      JSON.stringify({ error: `An article already exists at ${pathInRepo}. Pick a different slug.` }),
      { status: 409, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const fm = frontmatterFor(body);
  const content = `---\n${fm}\n---\n\n${body.body.trim()}\n`;
  const contentBase64 = btoa(unescape(encodeURIComponent(content)));

  try {
    const commit = await githubPutFile(
      env,
      pathInRepo,
      contentBase64,
      `admin: publish ${body.beat}/${body.slug}`,
    );
    return new Response(
      JSON.stringify({
        ok: true,
        commit: commit.commit,
        path: pathInRepo,
        url: `https://businessleaders.in/${body.beat}/${body.slug}/`,
        previewUrl: `https://businessleaders-site.pages.dev/${body.beat}/${body.slug}/`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
