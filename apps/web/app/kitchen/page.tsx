"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type KitchenOrder = {
  order_id: string;
  status: string;
  seat_id: string;
  created_at: string;
  items: { item_id: string; qty: number; notes?: string }[];
};

export default function Kitchen() {
  const [sessionId, setSessionId] = useState("sess_demo"); // demo: resolve ile gelen session id'yi buraya yazabilirsin
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [msg, setMsg] = useState("");

  async function refresh() {
    if (!sessionId) return;
    const r = await fetch(`${API}/v1/orders/kitchen/${encodeURIComponent(sessionId)}`);
    if (!r.ok) { setMsg("Session bulunamadı (ipucu: /t/demo sayfasında session id'yi kopyala)"); return; }
    const data = await r.json();
    setOrders(data.orders);
    setMsg("");
  }

  useEffect(() => {
    const t = setInterval(refresh, 2000);
    refresh();
    return () => clearInterval(t);
  }, [sessionId]);

  async function setStatus(orderId: string, status: string) {
    await fetch(`${API}/v1/orders/${orderId}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">KDS-lite</h1>

      <div className="rounded-xl border p-3 space-y-2">
        <div className="text-sm font-medium">Session ID</div>
        <input
          className="w-full rounded-xl border p-2 text-sm font-mono"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="sess_..."
        />
        <div className="text-xs text-slate-600">
          İpucu: Önce <a className="underline" href="/t/demo">/t/demo</a> aç, session id’yi kopyala, buraya yapıştır.
        </div>
        {msg ? <div className="text-sm">{msg}</div> : null}
      </div>

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.order_id} className="rounded-xl border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-sm">{o.order_id}</div>
                <div className="text-sm text-slate-600">
                  {o.status} • {o.seat_id} • {new Date(o.created_at).toLocaleTimeString("tr-TR")}
                </div>
              </div>
              <div className="flex gap-2">
                {["accepted", "preparing", "served"].map((s) => (
                  <button key={s} className="rounded-xl border px-3 py-1 text-xs" onClick={() => setStatus(o.order_id, s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm">
              {o.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-mono">{it.item_id}</span>
                  <span>x{it.qty}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {orders.length === 0 ? <div className="text-sm text-slate-600">Henüz sipariş yok.</div> : null}
      </div>
    </main>
  );
}
