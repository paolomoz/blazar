function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.MANIFEST) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const entries = await env.MANIFEST.get('entries', 'json');
  return new Response(JSON.stringify(entries || []), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
