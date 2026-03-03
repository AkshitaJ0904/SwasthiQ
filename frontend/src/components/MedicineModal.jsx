import { useState } from 'react';
import { X } from 'lucide-react';
import { createMedicine, updateMedicine } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Analgesic', 'Antibiotic', 'Antidiabetic', 'Antihypertensive', 'Antihistamine', 'Anticoagulant', 'Cardiovascular', 'Gastric', 'Neurological', 'Other'];

export default function MedicineModal({ medicine, onClose, onSuccess }) {
  const isEdit = !!medicine;
  const [form, setForm] = useState({
    name: medicine?.name || '',
    generic_name: medicine?.generic_name || '',
    category: medicine?.category || '',
    batch_no: medicine?.batch_no || '',
    expiry_date: medicine?.expiry_date || '',
    quantity: medicine?.quantity ?? '',
    cost_price: medicine?.cost_price ?? '',
    mrp: medicine?.mrp ?? '',
    supplier: medicine?.supplier || '',
  });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity),
        cost_price: parseFloat(form.cost_price),
        mrp: parseFloat(form.mrp)
      };
      if (isEdit) {
        await updateMedicine(medicine.id, payload);
        toast.success('Medicine updated!');
      } else {
        await createMedicine(payload);
        toast.success('Medicine added!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving medicine');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #E5E7EB', fontSize: 13, outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16
    }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
            {isEdit ? 'Update Medicine' : 'Add Medicine'}
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Medicine Name *</label>
              <input name="name" value={form.name} onChange={handle} required style={inputStyle} placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div>
              <label style={labelStyle}>Generic Name *</label>
              <input name="generic_name" value={form.generic_name} onChange={handle} required style={inputStyle} placeholder="e.g. Acetaminophen" />
            </div>
            <div>
              <label style={labelStyle}>Category *</label>
              <select name="category" value={form.category} onChange={handle} required style={inputStyle}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Batch No *</label>
              <input name="batch_no" value={form.batch_no} onChange={handle} required style={inputStyle} placeholder="e.g. PCM-2024-001" />
            </div>
            <div>
              <label style={labelStyle}>Expiry Date *</label>
              <input type="date" name="expiry_date" value={form.expiry_date} onChange={handle} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Quantity *</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handle} required min="0" style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Cost Price (₹) *</label>
              <input type="number" step="0.01" name="cost_price" value={form.cost_price} onChange={handle} required min="0" style={inputStyle} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>MRP (₹) *</label>
              <input type="number" step="0.01" name="mrp" value={form.mrp} onChange={handle} required min="0" style={inputStyle} placeholder="0.00" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Supplier *</label>
              <input name="supplier" value={form.supplier} onChange={handle} required style={inputStyle} placeholder="Supplier name" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid #E5E7EB',
              background: 'white', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500
            }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: '#1D4ED8', color: 'white', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Saving...' : isEdit ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
