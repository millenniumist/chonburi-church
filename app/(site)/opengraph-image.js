import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/seo';

export const alt = siteConfig.name;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#000',
              textAlign: 'center',
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              fontSize: 36,
              color: '#374151',
              textAlign: 'center',
            }}
          >
            {siteConfig.nameEn}
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#6b7280',
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            ศูนย์รวมของชุมชนคริสเตียน
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
