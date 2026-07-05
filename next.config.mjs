import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: [
    '127.0.0.1',
    '100.79.236.39',
    'mill.tail1d70bc.ts.net',
  ],

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
