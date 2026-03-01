"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResolveSessionResponse, ClaimSeatResponse, MenuResponse } from "@garson/shared";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

function fingerprint() {
  // Demo fingerprint (prod: daha sağlam)
  return "fp_" + Math.random().toString(16).slice(2);
}

export default function TablePage({ params }: { params: { qr_token: string } }) {
  const qrToken = params.qr_token;
  const [res, setRes] = useState<ResolveSessionResponse | null>(null);
  const [seatNo, setSeatNo] = useState<number | null>(null);
  const [claim, setClaim] = useState<ClaimSeatResponse | null>(null);
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string>("");

  const fp = useMemo(() => fingerprint(), []);

  useEffect(() => {
    (async () => {
      setStatus("Masa çözülüyor...");
      const r = await fetch(`${API}/v1/table-sessions/resolve?qr_token=${encodeURIComponent(qrToken)}`);
      if (!r.ok) { setStatus("Masa bulunamadı"); return; }
      const data = await r.json();
      setRes(data);
      setStatus("");
    })();
  }, [qrToken]);

  async function claimSeat(n: number) {
    if (!res) return;
    setStatus("Koltuk seçiliyor...");
    const r = await fetch(`${API}/v1/table-sessions/${res.session_id}/seats/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seat_no: n, client_fingerprint: fp }),
    });
    if (r.status === 409) { setStatus("Bu koltuk dolu, başka koltuk seç."); return; }
    if (!r.ok) { setStatus("Hata"); return; }
    const data = await r.json();
    setClaim(data);
    setSeatNo(n);
    setStatus("");

    // fetch menu
    const mr = await fetch(`${API}/v1/menus?branch_id=${encodeURIComponent(res.branch_id)}`);
    const mdata = await mr.json();
    setMenu(mdata);
  }

  function addToCart(itemId: string) {
    setCart((c) => ({ ...c, [itemId]: (c[itemId] || 0) + 1 }));
  }

  async function createOrder() {
    if (!res || !claim) return;
    const items = Object.entries(cart).map(([item_id, qty]) => ({ item_id, qty }));
    if (items.length === 0) { setStatus("Sepet boş"); return; }
    setStatus("Sipariş gönderiliyor...");
    const idempotency_key = crypto.randomUUID();
    const r = await fetch(`${API}/v1/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        session_id: res.session_id,
        seat_id: claim.seat_id,
        items,
        idempotency_key,
      }),
    });
    if (!r.ok) { setStatus("Sipariş hatası"); return; }
    const data = await r.json();
    setStatus(`Sipariş oluşturuldu: ${data.order_id}`);
    setCart({});
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">Masa Girişi</h1>

      {status ? <div className="rounded-xl border p-3">{status}</div> : null}

      {!res ? (
        <div className="rounded-xl border p-3">Yükleniyor...</div>
      ) : (
        <div className="rounded-xl border p-3 space-y-2">
          <div><b>{res.table_label}</b> — session: <span className="font-mono text-xs">{res.session_id}</span></div>
          <div className="text-sm text-slate-600">Bitiş: {new Date(res.expires_at).toLocaleString("tr-TR")}</div>

          {!claim ? (
            <>
              <div className="mt-2 font-medium">Koltuk seç</div>
              <div className="grid grid-cols-4 gap-2">
                {res.seats.map((s) => (
                  <button
                    key={s.seat_no}
                    className={`rounded-xl border p-2 text-sm ${s.status === "claimed" ? "opacity-50" : ""}`}
                    disabled={s.status === "claimed"}
                    onClick={() => claimSeat(s.seat_no)}
                  >
                    Koltuk {s.seat_no}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm">Seçilen koltuk: <b>{seatNo}</b> (claim: <span className="font-mono text-xs">{claim.claim_token}</span>)</div>
          )}
        </div>
      )}

      {menu && claim ? (
        <div className="rounded-xl border p-3 space-y-3">
          <h2 className="text-lg font-semibold">Menü</h2>
          {menu.categories.map((c) => (
            <div key={c.category_id} className="space-y-2">
              <div className="font-medium">{c.name}</div>
              <div className="space-y-2">
                {c.items.map((it) => (
                  <div key={it.item_id} className="flex items-center justify-between rounded-xl border p-2">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-slate-600">
                        {it.price} TRY • Alerjen: {it.allergens.join(", ")}
                      </div>
                    </div>
                    <button className="rounded-xl border px-3 py-1 text-sm" onClick={() => addToCart(it.item_id)}>
                      Sepete ekle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t space-y-2">
            <div className="font-medium">Sepet</div>
            {Object.keys(cart).length === 0 ? (
              <div className="text-sm text-slate-600">Boş</div>
            ) : (
              <div className="text-sm">
                {Object.entries(cart).map(([id, qty]) => (
                  <div key={id} className="flex justify-between">
                    <span className="font-mono">{id}</span>
                    <span>x{qty}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="rounded-xl border px-3 py-2 text-sm" onClick={createOrder}>
              Siparişi gönder
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
