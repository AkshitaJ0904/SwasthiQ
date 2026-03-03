const STATUS_STYLES = {
  ACTIVE: { bg: '#DCFCE7', color: '#16A34A', label: 'Active' },
  LOW_STOCK: { bg: '#FEF9C3', color: '#CA8A04', label: 'Low Stock' },
  EXPIRED: { bg: '#FEE2E2', color: '#DC2626', label: 'Expired' },
  OUT_OF_STOCK: { bg: '#F3F4F6', color: '#6B7280', label: 'Out of Stock' },
  COMPLETED: { bg: '#DCFCE7', color: '#16A34A', label: 'Completed' },
  PENDING: { bg: '#FEF9C3', color: '#CA8A04', label: 'Pending' },
  CANCELLED: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status?.toUpperCase()] || STATUS_STYLES.ACTIVE;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap'
    }}>
      {style.label}
    </span>
  );
}
