export default {
  async fetch(request, env) {
    const source = new URL(request.url);
    // The route /alpha* also matches /alphabet. Let the site's origin handle it.
    if (source.pathname !== '/alpha' && !source.pathname.startsWith('/alpha/')) {
      return fetch(request);
    }

    const origin = new URL(env.ALPHA_ORIGIN);
    const upstream = new URL(`${source.pathname}${source.search}`, origin);

    const headers = new Headers(request.headers);
    headers.set('x-forwarded-host', source.host);
    headers.set('x-forwarded-proto', source.protocol.replace(':', ''));

    return fetch(
      new Request(upstream, {
        method: request.method,
        headers,
        body: request.body,
        redirect: request.redirect,
      }),
    );
  },
};
