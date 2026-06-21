/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'pdf-parse',
      'pdfkit',
      '@browserbasehq/stagehand',
      'playwright-core',
      'patchright-core',
      'puppeteer-core',
    ],
  },
};

export default nextConfig;
