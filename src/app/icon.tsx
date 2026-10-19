import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1c1917',
          borderRadius: '7px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fafaf9"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Minimalist geometric slash */}
          <line x1="6" y1="18" x2="18" y2="6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
