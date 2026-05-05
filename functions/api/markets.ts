// Live Indian market quotes via Yahoo Finance's public chart endpoint.
// Free, no API key. Cached at the Cloudflare edge for 60s so Yahoo
// doesn't see one request per visitor.

interface Quote {
  name: string;
  symbol: string;
  val: string;
  pct: string;
  chg: string;
  up: boolean;
}

const SYMBOLS: { yahoo: string; name: string }[] = [
  { yahoo: '^BSESN', name: 'SENSEX' },
  { yahoo: '^NSEI', name: 'NIFTY 50' },
  { yahoo: 'RELIANCE.NS', name: 'RELIANCE' },
  { yahoo: 'TCS.NS', name: 'TCS' },
  { yahoo: 'GC=F', name: 'GOLD ($/oz)' },
];

function formatNumber(n: number, isCurrency = false): string {
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) {
    return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  return n.toFixed(2);
}

async function fetchOne(yahooSymbol: string): Promise<{ price: number; change: number } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=2d`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessLeaderMarkets/1.0)',
        Accept: 'application/json',
      },
      cf: { cacheTtl: 60, cacheEverything: true } as any,
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;
    const price = Number(meta.regularMarketPrice ?? meta.previousClose);
    const prev = Number(meta.chartPreviousClose ?? meta.previousClose);
    if (!isFinite(price) || !isFinite(prev) || prev === 0) return null;
    return { price, change: price - prev };
  } catch {
    return null;
  }
}

export const onRequest: PagesFunction = async () => {
  const results = await Promise.all(SYMBOLS.map((s) => fetchOne(s.yahoo)));
  const quotes: Quote[] = SYMBOLS.map((s, i) => {
    const q = results[i];
    if (!q) {
      return {
        name: s.name,
        symbol: s.yahoo,
        val: '—',
        pct: '—',
        chg: '—',
        up: true,
      };
    }
    const pct = (q.change / (q.price - q.change)) * 100;
    return {
      name: s.name,
      symbol: s.yahoo,
      val: formatNumber(q.price),
      pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
      chg: `${q.change >= 0 ? '+' : ''}${formatNumber(q.change)}`,
      up: q.change >= 0,
    };
  });

  return new Response(JSON.stringify({ quotes, fetchedAt: new Date().toISOString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Browser cache 30s; CDN cache 60s. Markets move fast enough that
      // staler-than-1m data is misleading.
      'Cache-Control': 'public, max-age=30, s-maxage=60',
    },
  });
};
