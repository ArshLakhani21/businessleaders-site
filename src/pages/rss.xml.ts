import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const all = await getCollection('articles');
  const items = all
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime())
    .slice(0, 50);

  return rss({
    title: 'Business Leaders India',
    description:
      'Original Indian news, business, finance, sport, lifestyle, and world coverage.',
    site: context.site!,
    items: items.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.publishedAt,
      description: entry.data.metaDescription,
      link: `/${entry.data.beat}/${entry.slug}/`,
      categories: [entry.data.beat, ...entry.data.tags],
      author: entry.data.author.name,
    })),
  });
}
