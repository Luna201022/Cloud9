let staffPin = null;
let autoTimer = null;

function qs(sel){ return document.querySelector(sel); }
function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

function askPin() {
  const p = prompt("Staff-PIN eingeben:");
  if (!p) return null;
  return p.trim();
}

async function apiGetOrders() {
  if (!staffPin) staffPin = askPin();
  if (!staffPin) throw new Error("Kein PIN");
  const res = await fetch("/api/staff/orders", {
    headers: { "Authorization": "Bearer " + staffPin },
    cache: "no-store"
  });
  const data = await res.json().catch(()=> ({}));
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
  return data;
}

async function apiSetStatus(key, status) {
  const res = await fetch("/api/staff/order", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + staffPin },
    body: JSON.stringify({ key, status })
  });
  const data = await res.json().catch(()=> ({}));
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
  return data;
}

async function apiDelete(key) {
  const res = await fetch("/api/staff/order", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + staffPin },
    body: JSON.stringify({ key, action: "delete" })
  });
  const data = await res.json().catch(()=> ({}));
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
  return data;
}

function fmtTime(ms){
  if (!ms) return "";
  try { return new Date(ms).toLocaleString(); } catch { return String(ms); }
}

function renderOrders(list) {
  const host = qs("#orders");
  if (!host) return;
  if (!list.length) { host.innerHTML = `<div class="muted">Keine Bestellungen.</div>`; return; }

  host.innerHTML = list.map(o => {
    const items = (o.items || []).map(it => `<li>${esc(it.id)} × ${esc(it.qty ?? 1)}</li>`).join("");
    const st = esc(o.status || "NEW");
    return `
      <div class="card">
        <div class="row">
          <div>
            <div class="h">Tisch ${esc(o.tableId)}</div>
            <div class="muted">${esc(o.key || "")}</div>
            <div class="muted">${fmtTime(o.createdAt)}${o.updatedAt ? " • upd " + fmtTime(o.updatedAt) : ""}</div>
          </div>
          <div class="status">${st}</div>
        </div>
        ${o.note ? `<div class="note">Notiz: ${esc(o.note)}</div>` : ""}
        <ul>${items}</ul>
        <div class="row actions">
          <button data-done="${esc(o.key)}">Erledigt</button>
          <button data-new="${esc(o.key)}">Zurück auf NEU</button>
          <button class="danger" data-del="${esc(o.key)}">Löschen</button>
        </div>
      </div>
    `;
  }).join("");

  host.querySelectorAll("[data-done]").forEach(b => b.onclick = async () => { await apiSetStatus(b.getAttribute("data-done"), "DONE"); await refresh(); });
  host.querySelectorAll("[data-new]").forEach(b => b.onclick = async () => { await apiSetStatus(b.getAttribute("data-new"), "NEW"); await refresh(); });
  host.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    const key = b.getAttribute("data-del");
    if (!confirm("Wirklich löschen?")) return;
    await apiDelete(key);
    await refresh();
  });
}

async function refresh() {
  qs("#err").textContent = "";
  try {
    const data = await apiGetOrders();
    renderOrders(data.orders || []);
    qs("#count").textContent = String(data.count ?? (data.orders||[]).length);
  } catch (e) {
    qs("#err").textContent = String(e?.message || e);
  }
}

function toggleAuto() {
  const btn = qs("#auto");
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; btn.textContent = "Auto: AUS"; }
  else { autoTimer = setInterval(refresh, 3000); btn.textContent = "Auto: AN"; }
}

window.addEventListener("load", () => {
  qs("#refresh").onclick = refresh;
  qs("#auto").onclick = toggleAuto;
  qs("#pin").onclick = () => { staffPin = askPin(); refresh(); };
  refresh();
});
