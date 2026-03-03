import { useState, useEffect } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, AlertTriangle, Package, CheckCircle, DollarSign, TrendingDown } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import MedicineModal from '../components/MedicineModal';
import { getMedicines, getInventoryOverview, deleteMedicine, patchMedicineStatus } from '../services/api';
import toast from 'react-hot-toast';

function formatCurrency(val) {
  if (!val && val !== 0) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN');
}

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    setLoading(true);
    const params = { page, size: 20 };
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    if (filterCategory) params.category = filterCategory;
    if (filterSupplier) params.supplier = filterSupplier;

    Promise.all([
      getMedicines(params),
      getInventoryOverview()
    ]).then(([mRes, oRes]) => {
      setMedicines(mRes.data.items || []);
      setTotalPages(mRes.data.pages || 1);
      setTotal(mRes.data.total || 0);
      setOverview(oRes.data);
    }).catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, [search, filterStatus, filterCategory, filterSupplier, page, refreshKey]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this medicine?')) return;
    try {
      await deleteMedicine(id);
      toast.success('Medicine deleted');
      refresh();
    } catch { toast.error('Error deleting'); }
  };

  const handleMarkStatus = async (id, status) => {
    try {
      await patchMedicineStatus(id, status);
      toast.success(`Marked as ${status}`);
      refresh();
    } catch { toast.error('Error updating status'); }
  };

  const categories = [...new Set(medicines.map(m => m.category))].filter(Boolean);

  return (
    <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: 32, overflowY: 'auto', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Inventory Management</h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 13 }}>Track and manage your medicine inventory</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', color: '#374151', cursor: 'pointer', fontSize: 13,
            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#1D4ED8', color: 'white', cursor: 'pointer', fontSize: 13,
            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Plus size={14} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#EFF6FF', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Package size={16} color="#1D4ED8" />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Total Items</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{overview?.total_items || 0}</div>
        </div>
        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <CheckCircle size={16} color="#16A34A" />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Active Stock</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{overview?.active_stock || 0}</div>
        </div>
        <div style={{ background: '#FFF7ED', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} color="#EA580C" />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Low Stock</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{overview?.low_stock || 0}</div>
        </div>
        <div style={{ background: '#FAF5FF', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <DollarSign size={16} color="#7C3AED" />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Total Value</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#111827' }}>{formatCurrency(overview?.total_value)}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or generic name..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', minWidth: 140 }}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="EXPIRED">Expired</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }} style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', minWidth: 140 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          value={filterSupplier}
          onChange={e => { setFilterSupplier(e.target.value); setPage(1); }}
          placeholder="Filter by supplier..."
          style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', minWidth: 160 }}
        />
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['MEDICINE NAME', 'GENERIC NAME', 'CATEGORY', 'BATCH NO', 'EXPIRY DATE', 'QUANTITY', 'COST PRICE', 'MRP', 'SUPPLIER', 'PREDICTED DAYS', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{
                  padding: '12px 14px', textAlign: 'left', fontSize: 11,
                  fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB',
                  whiteSpace: 'nowrap'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  {Array.from({ length: 12 }).map((_, j) => (
                    <td key={j} style={{ padding: '14px' }}>
                      <div style={{ height: 14, background: '#F3F4F6', borderRadius: 4, width: '80%', animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : medicines.length === 0 ? (
              <tr><td colSpan={12} style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                No medicines found. <button onClick={() => setShowAddModal(true)} style={{ color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Add one now</button>
              </td></tr>
            ) : medicines.map(med => (
              <tr key={med.id} style={{ borderBottom: '1px solid #F3F4F6' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <td style={{ padding: '14px', fontSize: 13, fontWeight: 500, color: '#111827' }}>
                  <div>{med.name}</div>
                  {med.expiring_soon && (
                    <div style={{ fontSize: 11, color: '#EA580C', marginTop: 2 }}>⚠ Expires in &lt;60 days</div>
                  )}
                </td>
                <td style={{ padding: '14px', fontSize: 13, color: '#6B7280' }}>{med.generic_name}</td>
                <td style={{ padding: '14px', fontSize: 13, color: '#6B7280' }}>{med.category}</td>
                <td style={{ padding: '14px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{med.batch_no}</td>
                <td style={{ padding: '14px', fontSize: 13, color: '#6B7280' }}>{med.expiry_date}</td>
                <td style={{ padding: '14px', fontSize: 13, fontWeight: 500, color: med.quantity < 20 ? '#EF4444' : '#111827' }}>
                  {med.quantity}
                </td>
                <td style={{ padding: '14px', fontSize: 13 }}>₹{med.cost_price?.toFixed(2)}</td>
                <td style={{ padding: '14px', fontSize: 13, fontWeight: 500 }}>₹{med.mrp?.toFixed(2)}</td>
                <td style={{ padding: '14px', fontSize: 13, color: '#6B7280' }}>{med.supplier}</td>
                <td style={{ padding: '14px', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <TrendingDown size={12} color="#6B7280" />
                    <span style={{ color: med.predicted_days_to_low_stock < 10 ? '#EF4444' : '#374151' }}>
                      {med.predicted_days_to_low_stock}d
                    </span>
                  </div>
                </td>
                <td style={{ padding: '14px' }}><StatusBadge status={med.status} /></td>
                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setEditMedicine(med)} title="Edit" style={{
                      border: 'none', background: '#EFF6FF', color: '#1D4ED8',
                      borderRadius: 6, padding: '5px 8px', cursor: 'pointer'
                    }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleMarkStatus(med.id, 'EXPIRED')} title="Mark Expired" style={{
                      border: 'none', background: '#FEF2F2', color: '#DC2626',
                      borderRadius: 6, padding: '5px 6px', cursor: 'pointer', fontSize: 10, fontWeight: 500
                    }}>
                      EXP
                    </button>
                    <button onClick={() => handleMarkStatus(med.id, 'OUT_OF_STOCK')} title="Mark Out of Stock" style={{
                      border: 'none', background: '#F3F4F6', color: '#6B7280',
                      borderRadius: 6, padding: '5px 6px', cursor: 'pointer', fontSize: 10, fontWeight: 500
                    }}>
                      OOS
                    </button>
                    <button onClick={() => handleDelete(med.id)} title="Delete" style={{
                      border: 'none', background: '#FEF2F2', color: '#EF4444',
                      borderRadius: 6, padding: '5px 8px', cursor: 'pointer'
                    }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total} medicines
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13
            }}>Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontSize: 13
            }}>Next</button>
          </div>
        </div>
      )}

      {showAddModal && <MedicineModal onClose={() => setShowAddModal(false)} onSuccess={refresh} />}
      {editMedicine && <MedicineModal medicine={editMedicine} onClose={() => setEditMedicine(null)} onSuccess={refresh} />}
    </div>
  );
}
