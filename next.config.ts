import nextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = nextIntlPlugin("./src/lib/i18n.ts");

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost", "api.diasporatontine.com"],
  },
};

export default withNextIntl(nextConfig);
