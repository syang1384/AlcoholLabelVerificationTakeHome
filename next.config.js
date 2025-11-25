/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // You already had this – keep it
    serverComponentsExternalPackages: ['sharp', 'tesseract.js'],

    // 👇 This is the important part: include tesseract.js-core files
    outputFileTracingIncludes: {
      // Your main OCR route
      'src/app/api/verify/route.ts': [
        './node_modules/tesseract.js-core/**/*',
      ],
      // Optional: if this route also uses Tesseract, keep it; otherwise you can delete this block
      'src/app/api/verify-simple/route.ts': [
        './node_modules/tesseract.js-core/**/*',
      ],
    },
  },

  // No custom webpack needed for Tesseract anymore
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
