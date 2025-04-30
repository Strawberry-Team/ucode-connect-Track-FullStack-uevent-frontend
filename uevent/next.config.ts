// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Отключаем строгий режим
  onDemandEntries: {
    // Настройки буферизации страниц
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  devIndicators: false,
  trailingSlash: true,
};

module.exports = nextConfig;