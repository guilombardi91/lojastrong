import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Fotos de produto sobem como Server Action (ver uploadProductImageAction);
      // o limite padrão de 1MB é curto para foto de celular.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
