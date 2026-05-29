import type { NextConfig } from "next";

function getRepoName() {
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  return repo && !repo.endsWith(".github.io") ? repo : "";
}

const repoName = getRepoName();
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd && repoName ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
};

export default nextConfig;
