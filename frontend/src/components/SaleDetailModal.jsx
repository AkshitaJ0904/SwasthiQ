import { X } from "lucide-react";
import StatusBadge from "./StatusBadge";

export default function SaleDetailModal({ sale, onClose }) {
  if (!sale) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}>
      <div style={{
        background: "white",
        width: 500,
        borderRadius: 12,
        padding: 24
      }}>
        
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Invoice {sale.invoice_number}</h2>
          <button onClick={onClose} style={{ border: "none", background: "none" }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ marginTop: 8, fontSize: 14 }}>
          Patient: <b>{sale.patient_name}</b><br/>
          Payment Method: <b>{sale.payment_method}</b><br/>
          Total Amount: <b>₹{sale.total_amount}</b>
        </p>

        <h3 style={{ fontSize: 16, marginTop: 20 }}>Items</h3>
        <ul style={{ paddingLeft: 18 }}>
          {sale.items.map((i, idx) => (
            <li key={idx}>
              Medicine ID: {i.medicine_id} — Qty: {i.quantity} — ₹{i.price}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 12 }}>
          <StatusBadge status={sale.payment_method === "Pending" ? "PENDING" : sale.status} />
        </div>
      </div>
    </div>
  );
}