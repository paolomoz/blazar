export async function onRequestGet(context) {
  const { params, env } = context;

  if (!env.REPORTS) {
    return new Response('Report storage not configured', { status: 500 });
  }

  // [[id]] catch-all gives an array of path segments — join them back
  const slug = (params.id || []).join('/');
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const html = await env.REPORTS.get(slug);
  if (!html) {
    return new Response('Report not found', { status: 404 });
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache',
    },
  });
}
