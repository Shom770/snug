/** @type {import('next').NextConfig} */
// STATIC_EXPORT=1 (npm run export) builds plain files into out/ for Cloudflare, where the Worker serves /backend/*
// itself. In dev, /backend/* is proxied to the local FastAPI so the browser stays same-origin either way.
const nextConfig = process.env.STATIC_EXPORT
  ? { reactStrictMode: false, output: 'export', images: { unoptimized: true } }
  : {
      reactStrictMode: false,
      async rewrites() {
        return [{ source: '/backend/:path*', destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8787'}/:path*` }];
      },
    };
export default nextConfig;
