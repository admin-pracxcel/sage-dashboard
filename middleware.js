export default function middleware(request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      // Split on FIRST ':' only — passwords can contain colons.
      const idx = decoded.indexOf(':');
      if (idx !== -1) {
        const user = decoded.substring(0, idx);
        const pass = decoded.substring(idx + 1);
        if (user === process.env.AUTH_USER && pass === process.env.AUTH_PASS) {
          return;
        }
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Dashboard"',
    },
  });
}

export const config = {
  matcher: '/(.*)',
};
