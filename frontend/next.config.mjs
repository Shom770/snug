/** @type {import('next').NextConfig} */
// STATIC_EXPORT=1 (npm run export) builds plain files into out/ for Cloudflare, where the Worker serves /backend/*
// itself. In dev, /backend/* is proxied to the local FastAPI so the browser stays same-origin either way.
// Dev builds into .next-dev, so an export (which uses .next) can run while `npm run dev` is up.
const nextConfig = process.env.STATIC_EXPORT
  ? { reactStrictMode: false, output: 'export', images: { unoptimized: true } }
  : {
      reactStrictMode: false,
      distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
      async rewrites() {
        return [{ source: '/backend/:path*', destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8787'}/:path*` }];
      },
    };
export default nextConfig;
