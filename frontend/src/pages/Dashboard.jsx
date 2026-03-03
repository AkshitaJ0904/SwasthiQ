import { useState, useEffect } from 'react';
import { ShoppingCart, Download, Plus, Filter, Package, AlertTriangle, Box, CheckCircle, DollarSign, Search, Edit2, Trash2, X } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import MedicineModal from '../components/MedicineModal';
import { getDashboardSummary, getInventoryOverview, getRecentSales, getMedicines, getAllMedicines, createSale, patchMedicineStatus, deleteMedicine, getPurchaseOrders, createPurchaseOrder, updatePOStatus, getSale } from '../services/api';
import toast from 'react-hot-toast';
import SaleDetailModal from "../components/SaleDetailModal";

const TAB_SALES = 'Sales';
const TAB_PURCHASE = 'Purchase';
const TAB_INVENTORY = 'Inventory';

function formatCurrency(val) {
  if (!val && val !== 0) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN');
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
}

function exportToCSV(data, filename) {
  if (!data || data.length === 0) { toast.error('No data to export'); return; }
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h] ?? '';
      return typeof val === 'string' && (val.includes(',') || val.includes('\n'))
        ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [tab, setTab] = useState(TAB_INVENTORY);
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [patientId, setPatientId] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [viewSale, setViewSale] = useState(null);

  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    setLoading(true);
    Promise.all([getDashboardSummary(), getInventoryOverview(), getRecentSales(10), getAllMedicines()])
      .then(([s, o, rs, meds]) => {
        setSummary(s.data); setOverview(o.data);
        setRecentSales(rs.data); setAllMedicines(meds.data);
      }).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    if (filterCategory) params.category = filterCategory;
    getMedicines(params).then(r => setMedicines(r.data.items || []));
  }, [search, filterStatus, filterCategory, refreshKey]);

  const handleMedicineSearch = (val) => {
    setMedicineSearch(val);
    if (val.length > 1) {
      const results = allMedicines.filter(m =>
        m.name.toLowerCase().includes(val.toLowerCase()) ||
        m.generic_name.toLowerCase().includes(val.toLowerCase())
      ).filter(m => m.status === 'ACTIVE' || m.status === 'LOW_STOCK');
      setSearchResults(results.slice(0, 6));
      setShowSearchDropdown(true);
    } else { setShowSearchDropdown(false); }
  };

  const addToSale = (med) => {
    const existing = saleItems.find(i => i.medicine_id === med.id);
    if (existing) {
      setSaleItems(items => items.map(i => i.medicine_id === med.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSaleItems(items => [...items, { medicine_id: med.id, name: med.name, price: med.mrp, quantity: 1, max: med.quantity }]);
    }
    setMedicineSearch(''); setShowSearchDropdown(false);
  };

  const removeFromSale = (medicine_id) => setSaleItems(items => items.filter(i => i.medicine_id !== medicine_id));

  const handleBill = async () => {
    if (!patientId) return toast.error('Enter Patient ID');
    if (saleItems.length === 0) return toast.error('Add at least one medicine');
    try {
      await createSale({
        patient_name: `Patient ${patientId}`, patient_id: patientId, payment_method: paymentMethod,
        items: saleItems.map(i => ({ medicine_id: i.medicine_id, quantity: i.quantity, price: i.price }))
      });
      toast.success('Sale created!'); setSaleItems([]); setPatientId(''); refresh();
    } catch (err) { toast.error(err.response?.data?.detail || 'Error creating sale'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this medicine?')) return;
    try { await deleteMedicine(id); toast.success('Deleted'); refresh(); }
    catch { toast.error('Error deleting'); }
  };

  const handleExportInventory = () => {
    exportToCSV(medicines.map(m => ({
      Name: m.name, Generic_Name: m.generic_name, Category: m.category,
      Batch_No: m.batch_no, Expiry_Date: m.expiry_date, Quantity: m.quantity,
      Cost_Price: m.cost_price, MRP: m.mrp, Supplier: m.supplier, Status: m.status
    })), 'inventory_export.csv');
  };

  const handleExportSales = () => {
    exportToCSV(recentSales.map(s => ({
      Invoice: s.invoice_number, Patient: s.patient_name, Items: s.item_count,
      Payment_Method: s.payment_method, Total_Amount: s.total_amount,
      Date: formatDate(s.created_at), Status: s.status
    })), 'sales_export.csv');
  };

  const tabStyle = (t) => ({
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: tab === t ? 'white' : 'transparent',
    color: tab === t ? '#111827' : '#6B7280', cursor: 'pointer', fontSize: 13,
    fontWeight: tab === t ? 500 : 400, display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s'
  });

  return (
    <div style={{ flex: 1, background: 'white', borderRadius: 20, padding: 32, overflowY: 'auto', boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Pharmacy CRM</h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 13 }}>Manage inventory, sales, and purchase orders</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => {
            if (tab === TAB_INVENTORY) handleExportInventory();
            else if (tab === TAB_SALES) handleExportSales();
            else toast('Switch to Inventory or Sales tab to export');
          }} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', color: '#374151', cursor: 'pointer', fontSize: 13,
            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', color: 'white', cursor: 'pointer', fontSize: 13,
            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <Plus size={14} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
        <MetricCard
          icon={DollarSign}
          iconBg="linear-gradient(135deg, #22C55E, #16A34A)"
          badge={
            summary
              ? `${summary.sales_growth > 0 ? "↗ +" : "↘ - "}${Math.abs(
                  Number(summary.sales_growth)
                )}%`
              : "+12.5%"
          }
          badgeBg={
            summary
              ? summary.sales_growth > 0
                ? "#F0FDF4"   // green bg
                : "#FEE2E2"   // red bg
              : "#F0FDF4"
          }
          badgeColor={
            summary
              ? summary.sales_growth > 0
                ? "#16A34A"   // green text
                : "#DC2626"   // red text
              : "#16A34A"
          }
          value={summary ? formatCurrency(summary.today_sales) : '₹1,24,580'}
          label="Today's Sales"
        />
        <MetricCard
          icon={ShoppingCart}
          iconBg="linear-gradient(135deg, #3B82F6, #1D4ED8)"
          badge={summary ? `${Number(summary.total_orders)} Orders` : '32 Orders'}
          badgeBg="#EFF6FF" badgeColor="#1D4ED8"
          value={summary ? Number(summary.items_sold_today) : 156}
          label="Items Sold Today"
        />
        <MetricCard
          icon={AlertTriangle}
          iconBg="linear-gradient(135deg, #FB923C, #EA580C)"
          badge="Action Needed"
          badgeBg="#FFF7ED" badgeColor="#EA580C"
          value={summary ? summary.low_stock_count : 12}
          label="Low Stock Items"
        />
        <MetricCard
          icon={Package}
          iconBg="linear-gradient(135deg, #A855F7, #7C3AED)"
          badge={summary ? `${summary.pending_po_count} Pending` : '5 Pending'}
          badgeBg="#FAF5FF" badgeColor="#7C3AED"
          value={summary ? formatCurrency(summary.purchase_order_total) : '₹96,250'}
          label="Purchase Orders"
        />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, background: '#F9FAFB', borderRadius: 10, padding: '4px 8px'
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setTab(TAB_SALES)} style={tabStyle(TAB_SALES)}><ShoppingCart size={14} /> Sales</button>
          <button onClick={() => setTab(TAB_PURCHASE)} style={tabStyle(TAB_PURCHASE)}><Package size={14} /> Purchase</button>
          <button onClick={() => setTab(TAB_INVENTORY)} style={tabStyle(TAB_INVENTORY)}><Box size={14} /> Inventory</button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
  onClick={() => setTab(TAB_SALES)}
  style={{
    padding: '7px 18px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    color: 'white',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
  }}
>
  <Plus size={14} color="white" /> New Sale
</button>
          <button onClick={() => setTab(TAB_PURCHASE)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid #E5E7EB',
            background: 'white', color: '#374151', cursor: 'pointer', fontSize: 12,
            fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4
          }}><Plus size={12} /> New Purchase</button>
        </div>
      </div>

      {/* SALES TAB */}
      {tab === TAB_SALES && (
        <div>
          <div style={{ background: '#F0F9FF', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Make a Sale</h3>
            <p style={{ margin: '0 0 16px', color: '#6B7280', fontSize: 13 }}>Select medicines from inventory</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
              <input value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Patient Id"
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', width: 180, background: 'white' }} />
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input value={medicineSearch} onChange={e => handleMedicineSearch(e.target.value)} placeholder="Search medicines..."
                  style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: 'white', boxSizing: 'border-box' }} />
                {showSearchDropdown && searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
                    {searchResults.map(m => (
                      <div key={m.id} onClick={() => addToSale(m)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <div style={{ fontWeight: 500 }}>{m.name}</div>
                        <div style={{ color: '#6B7280', fontSize: 12 }}>{m.generic_name} • Stock: {m.quantity} • ₹{m.mrp}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setShowSearchDropdown(false)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Enter</button>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: 'white' }}>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Pending">Pending</option>
              </select>
              <button onClick={handleBill} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Bill</button>
            </div>
            <div style={{ marginTop: 16, background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['MEDICINE NAME', 'GENERIC NAME', 'BATCH NO', 'EXPIRY DATE', 'QUANTITY', 'MRP / PRICE', 'SUPPLIER', 'STATUS', 'ACTIONS'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {saleItems.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Search and add medicines above</td></tr>
                  ) : saleItems.map(item => {
                    const med = allMedicines.find(m => m.id === item.medicine_id);
                    return (
                      <tr key={item.medicine_id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{item.name}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280' }}>{med?.generic_name}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{med?.batch_no}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{med?.expiry_date}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>
                          <input type="number" min={1} max={item.max} value={item.quantity}
                            onChange={e => setSaleItems(items => items.map(i => i.medicine_id === item.medicine_id ? { ...i, quantity: parseInt(e.target.value) || 1 } : i))}
                            style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 13 }} />
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>₹{item.price}</td>
                        <td style={{ padding: '10px 12px', fontSize: 13 }}>{med?.supplier}</td>
                        <td style={{ padding: '10px 12px' }}><StatusBadge status={med?.status} /></td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={() => removeFromSale(item.medicine_id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}><X size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Recent Sales</h3>
              <button onClick={handleExportSales} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#374151', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={12} /> Export Sales
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentSales.map(sale => (
                <div key={sale.id} onClick={() => getSale(sale.id).then(r => setViewSale(r.data))}
                  style={{ display: 'flex', cursor: "pointer", alignItems: 'center', padding: '16px 20px', background: 'white', border: '1px solid #F3F4F6', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, flexShrink: 0 }}>
                    <ShoppingCart size={18} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{sale.invoice_number}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sale.patient_name} • {sale.item_count} items • {sale.payment_method}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>₹{sale.total_amount?.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(sale.created_at)}</div>
                  </div>
                  <StatusBadge status={sale.payment_method === "Pending" ? "PENDING" : sale.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === TAB_PURCHASE && (
        <PurchaseTab viewSale={viewSale} setViewSale={setViewSale} />
      )}

      {tab === TAB_INVENTORY && (
        <div>
          {/* INVENTORY OVERVIEW */}
<div
  style={{
    background: "#F0FDF4",
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    border: "1px solid #DCFCE7"
  }}
>
  <h3
    style={{
      margin: "0 0 20px",
      fontSize: 18,
      fontWeight: 600,
      color: "#0F172A"
    }}
  >
    Inventory Overview
  </h3>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 20
    }}
  >
    {/* ONE CARD STYLE USED FOR ALL */}
    {[
      {
        label: "Total Items",
        value: overview?.total_items || 0,
        icon: <Package size={20} color="#3B82F6" />
      },
      {
        label: "Active Stock",
        value: overview?.active_stock || 0,
        icon: <CheckCircle size={20} color="#22C55E" />
      },
      {
        label: "Low Stock",
        value: overview?.low_stock || 0,
        icon: <AlertTriangle size={20} color="#F59E0B" />
      },
      {
        label: "Total Value",
        value: formatCurrency(overview?.total_value),
        icon: <DollarSign size={20} color="#A855F7" />
      }
    ].map((item, idx) => (
      <div
        key={idx}
        style={{
          background: "white",
          borderRadius: 14,
          padding: "16px 20px",
          border: "1px solid #E2F5E5",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          minHeight: 90   // 🔥 SHORTER HEIGHT LIKE YOUR SAMPLE
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6  // 🔥 VALUE MOVES UP CLOSER
          }}
        >
          <span style={{ fontSize: 14, color: "#475569" }}>{item.label}</span>
          {item.icon}
        </div>

        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: "28px"
          }}
        >
          {item.value}
        </span>
      </div>
    ))}
  </div>
</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Complete Inventory</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  style={{ padding: '7px 12px 7px 30px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none' }} />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none' }}>
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="EXPIRED">Expired</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
              <button style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#374151', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Filter size={12} /> Filter
              </button>
              <button onClick={handleExportInventory} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#374151', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={12} /> Export
              </button>
            </div>
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['MEDICINE NAME', 'GENERIC NAME', 'CATEGORY', 'BATCH NO', 'EXPIRY DATE', 'QUANTITY', 'COST PRICE', 'MRP', 'SUPPLIER', 'STATUS', 'ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No medicines found</td></tr>
                ) : medicines.map(med => (
                  <tr key={med.id} style={{ borderBottom: '1px solid #F3F4F6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '14px', fontSize: 13, fontWeight: 500, color: '#111827', maxWidth: 150 }}>
                      {med.name}
                      {med.expiring_soon && <span style={{ marginLeft: 4, fontSize: 10, color: '#EA580C' }}>⚠ Exp Soon</span>}
                    </td>
                    <td style={{ padding: '14px', fontSize: 13, color: '#6B7280' }}>{med.generic_name}</td>
                    <td style={{ padding: '14px', fontSize: 13, color: '#6B7280' }}>{med.category}</td>
                    <td style={{ padding: '14px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{med.batch_no}</td>
                    <td style={{ padding: '14px', fontSize: 13, color: '#6B7280' }}>{med.expiry_date}</td>
                    <td style={{ padding: '14px', fontSize: 13, fontWeight: 500, color: med.quantity < 20 ? '#EF4444' : '#111827' }}>{med.quantity}</td>
                    <td style={{ padding: '14px', fontSize: 13 }}>₹{med.cost_price?.toFixed(2)}</td>
                    <td style={{ padding: '14px', fontSize: 13 }}>₹{med.mrp?.toFixed(2)}</td>
                    <td style={{ padding: '14px', fontSize: 13, color: '#6B7280' }}>{med.supplier}</td>
                    <td style={{ padding: '14px' }}><StatusBadge status={med.status} /></td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditMedicine(med)} style={{ border: 'none', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11 }}><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(med.id)} style={{ border: 'none', background: '#FEF2F2', color: '#EF4444', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 11 }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {medicines.length > 0 && <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280', textAlign: 'right' }}>Showing {medicines.length} medicines</div>}
        </div>
      )}

      {showAddModal && <MedicineModal onClose={() => setShowAddModal(false)} onSuccess={refresh} />}
      {editMedicine && <MedicineModal medicine={editMedicine} onClose={() => setEditMedicine(null)} onSuccess={refresh} />}
      {viewSale && <SaleDetailModal sale={viewSale} onClose={() => setViewSale(null)} />}
    </div>
  );
}

// ─── PURCHASE TAB ─────────────────────────────────────────────────────────────
// Status values MUST match backend POStatus enum exactly:
// PENDING, APPROVED, RECEIVED, CANCELLED
const PO_STATUSES = ['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'];

const PO_STATUS_COLORS = {
  PENDING:   { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047' },
  APPROVED:  { bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  RECEIVED:  { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
  CANCELLED: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
};

function PurchaseTab({ viewSale, setViewSale }) {
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [form, setForm] = useState({ supplier: '', medicine_name: '', quantity: '', unit_cost: '', expected_delivery: '' });

  const loadOrders = () => getPurchaseOrders().then(r => setOrders(r.data)).catch(() => {});
  useEffect(() => { loadOrders(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updatePOStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      loadOrders();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = filterStatus
    ? orders.filter(o => o.status?.toUpperCase() === filterStatus)
    : orders;

  const counts = orders.reduce((acc, o) => {
    const s = o.status?.toUpperCase() || 'UNKNOWN';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {PO_STATUSES.map(s => {
          const colors = PO_STATUS_COLORS[s];
          const active = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(active ? '' : s)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: active ? colors.bg : 'white',
              color: active ? colors.color : '#6B7280',
              border: `1.5px solid ${active ? colors.border : '#E5E7EB'}`,
              transition: 'all 0.15s'
            }}>
              {s.charAt(0) + s.slice(1).toLowerCase()} ({counts[s] || 0})
            </button>
          );
        })}
        {filterStatus && (
          <button onClick={() => setFilterStatus('')} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: 'none', border: '1.5px solid #E5E7EB', color: '#6B7280' }}>✕ Clear</button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
          Purchase Orders
          {filterStatus && <span style={{ marginLeft: 8, fontSize: 13, color: '#6B7280', fontWeight: 400 }}>— {filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()}</span>}
        </h3>
        <button onClick={() => setShowForm(f => !f)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: 'white', cursor: 'pointer', fontSize: 13 }}>+ New Order</button>
      </div>

      {showForm && (
        <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {['supplier', 'medicine_name', 'quantity', 'unit_cost', 'expected_delivery'].map(field => (
              <input key={field} placeholder={field.replace(/_/g, ' ')} value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                type={field === 'expected_delivery' ? 'date' : field === 'quantity' || field === 'unit_cost' ? 'number' : 'text'}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
            ))}
            <button onClick={async () => {
              try {
                await createPurchaseOrder({ ...form, quantity: parseInt(form.quantity), unit_cost: parseFloat(form.unit_cost) });
                toast.success('Purchase order created');
                setShowForm(false);
                setForm({ supplier: '', medicine_name: '', quantity: '', unit_cost: '', expected_delivery: '' });
                loadOrders();
              } catch { toast.error('Error creating order'); }
            }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: 'white', cursor: 'pointer', fontSize: 13 }}>Submit</button>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['PO NUMBER', 'SUPPLIER', 'MEDICINE', 'QTY', 'UNIT COST', 'TOTAL', 'STATUS', 'DELIVERY'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                {filterStatus ? `No ${filterStatus.toLowerCase()} orders` : 'No purchase orders'}
              </td></tr>
            ) : filteredOrders.map(o => {
              const s = o.status?.toUpperCase() || 'PENDING';
              const colors = PO_STATUS_COLORS[s] || { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>{o.po_number}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>{o.supplier}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>{o.medicine_name}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>{o.quantity}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13 }}>₹{o.unit_cost}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>₹{o.total_cost?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <select value={s} disabled={updatingId === o.id}
                      onChange={e => handleStatusChange(o.id, e.target.value)}
                      style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                        border: `1.5px solid ${colors.border}`, background: colors.bg, color: colors.color,
                        cursor: updatingId === o.id ? 'not-allowed' : 'pointer',
                        outline: 'none', opacity: updatingId === o.id ? 0.5 : 1
                      }}>
                      {PO_STATUSES.map(st => (
                        <option key={st} value={st}>{st.charAt(0) + st.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280' }}>{o.expected_delivery}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewSale && <SaleDetailModal sale={viewSale} onClose={() => setViewSale(null)} />}
    </div>
  );
}
