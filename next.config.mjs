import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,

  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /test/,
        contextRegExp: /thread-stream/,
      })
    );
    return config;
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
