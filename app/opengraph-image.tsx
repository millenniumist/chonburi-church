import { ImageResponse } from 'next/og';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';

export const alt = t(site.name);
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '80px',
          background: 'linear-gradient(135deg, #fbf8f3 0%, #e9ddcb 60%, #c9a87c 100%)',
          color: '#3b2a1d',
          fontSize: 64,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 700 }}>{t(site.name, 'en')}</div>
        <div style={{ marginTop: 24, fontSize: 40, opacity: 0.8 }}>{t(site.tagline, 'en')}</div>
      </div>
    ),
    size,
  );
}
