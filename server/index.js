export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const response = await env.ASSETS.fetch(new Request(new URL(path, request.url), request));

    if (response.status !== 404 || path === "/index.html") return response;

    const fallback = await env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
    return new Response(fallback.body, {
      status: fallback.status,
      headers: { ...Object.fromEntries(fallback.headers), "content-type": "text/html; charset=utf-8" },
    });
  },
};
