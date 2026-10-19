import { ImageResponse } from 'next/og';

export const alt = 'LifeOS — A Quiet Personal Dashboard for Students and Builders';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#fafaf9', // warm stone-50
          padding: '64px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1917', // stone-900
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '11px',
                backgroundColor: '#1c1917',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fafaf9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#1c1917',
              }}
            >
              LifeOS
            </span>
          </div>

          {/* Privacy badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: '#f5f5f4', // stone-100
              border: '1px solid #e7e5e4', // stone-200
              fontSize: '14px',
              fontWeight: 500,
              color: '#57534e', // stone-600
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '9999px',
                backgroundColor: '#10b981', // emerald-500
              }}
            />
            Postgres RLS Multi-Tenant
          </div>
        </div>

        {/* Center Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '920px',
          }}
        >
          <div
            style={{
              fontSize: '56px',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              color: '#1c1917',
            }}
          >
            A quiet personal dashboard for students and builders.
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: '#78716c', // stone-500
              lineHeight: 1.4,
            }}
          >
            Daily tasks, deliverables, projects, habits, and an allowance-aware pocket money ledger.
          </div>
        </div>

        {/* Bottom Feature Bento Cards */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          {[
            { label: 'Tasks & Checklist', desc: 'Zero-latency optimistic UI', dot: '#3b82f6' },
            { label: 'Pocket Money', desc: 'Allowance safe daily budget', dot: '#10b981' },
            { label: 'Workspaces', desc: 'Kanban boards & milestones', dot: '#8b5cf6' },
            { label: 'Notes & Sparks', desc: 'Checklists with 1-click promote', dot: '#f97316' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '18px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e7e5e4',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#292524',
                }}
              >
                <div
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '9999px',
                    backgroundColor: item.dot,
                  }}
                />
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#78716c',
                }}
              >
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
