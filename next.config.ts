import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/findmypet/**",
      },
      {
        protocol: "https",
        hostname: "storage.findmypet.com.br",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
