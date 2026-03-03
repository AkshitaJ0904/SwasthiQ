export default function MetricCard({ icon, iconBg, badge, badgeColor, badgeBg, value, label }) {
  const Icon = icon;
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '20px 24px',
      flex: 1,
      minWidth: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid #F3F4F6'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: iconBg, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
        
        {Icon && (typeof Icon === 'function' || typeof Icon === 'object') ? (
          <Icon size={22} color="white" strokeWidth={2} />
        ) : (
          <span style={{ fontSize: 20 }}>{icon}</span>
        )}
      </div>
        {badge && (
          <span style={{
            fontSize: 12, fontWeight: 500, padding: '3px 8px',
            borderRadius: 20, background: badgeBg || '#F0FDF4',
            color: badgeColor || '#16A34A'
          }}>
            {typeof badge === 'object' ? JSON.stringify(badge) : badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 4, letterSpacing: '-0.5px' }}>
        {typeof value === 'object' ? JSON.stringify(value) : value}
      </div>
      <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 400 }}>{label}</div>
    </div>
  );
}