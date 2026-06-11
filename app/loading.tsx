export default function Loading() {
  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      backgroundColor: 'var(--bg)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header Placeholder */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        height: 48
      }}>
        <div style={{ width: 140, height: 24, backgroundColor: 'var(--border)', borderRadius: 4 }} className="pulse" />
        <div style={{ width: 40, height: 40, backgroundColor: 'var(--border)', borderRadius: '50%' }} className="pulse" />
      </div>

      {/* Banner Simulation */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: 'var(--border)',
        borderRadius: 'var(--radius)'
      }} className="pulse" />

      {/* Categories Bar Simulation */}
      <div style={{ display: 'flex', gap: 12, overflow: 'hidden' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--border)' }} className="pulse" />
            <div style={{ width: 48, height: 12, backgroundColor: 'var(--border)', borderRadius: 2 }} className="pulse" />
          </div>
        ))}
      </div>

      {/* Products Grid Simulation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 120, height: 20, backgroundColor: 'var(--border)', borderRadius: 4 }} className="pulse" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16
        }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: 'var(--border)', borderRadius: 'var(--radius)' }} className="pulse" />
              <div style={{ width: '80%', height: 14, backgroundColor: 'var(--border)', borderRadius: 2 }} className="pulse" />
              <div style={{ width: '40%', height: 16, backgroundColor: 'var(--border)', borderRadius: 2 }} className="pulse" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }
        .pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}
