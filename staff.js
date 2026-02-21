(() => {
  const API = "/api/staff/orders";
  const PIN_KEY = "cloud9_staff_pin";
  const AUTO_KEY = "cloud9_staff_auto";
  const AUTO_MS = 3000;

  const el = (id) => document.getElementById(id);

  const state = {
    pin: null,
    auto: true,
    timer: null,
    lastSig: null,
    orders: [],
  };

  function nowText() {
    try { return new Date().toLocaleString(); } catch(e){ return String(Date.now()); }
  }

  function setStatus(ok, msg) {
    el("statusText").textContent = msg;
    const dot = el("statusDot");
    dot.classList.remove("ok","bad");
    dot.classList.add(ok ? "ok" : "bad");
  }

  function askPin(force=false) {
    const existing = sessionStorage.getItem(PIN_KEY);
    if (!force && existing) {
      state.pin = existing;
      return true;
    }
    const p = prompt("Staff-PIN eingeben:");
    if (!p) return false;
    state.pin = String(p).trim();
    sessionStorage.setItem(PIN_KEY, state.pin);
    return true;
  }

  function logout() {
    sessionStorage.removeItem(PIN_KEY);
    state.pin = null;
    setStatus(false, "Abgemeldet");
    renderOrders([]);
  }

  function setAuto(on) {
    state.auto = !!on;
    localStorage.setItem(AUTO_KEY, state.auto ? "1" : "0");
    el("btnAuto").textContent = "Auto: " + (state.auto ? "AN" : "AUS");
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (state.auto) state.timer = setInterval(refresh, AUTO_MS);
  }

  function readAutoPref() {
    const v = localStorage.getItem(AUTO_KEY);
    if (v === "0") return false;
    return true;
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  function statusBadge(status) {
    const s = String(status || "NEW").toUpperCase();
    if (s === "NEW") return '<span class="badge new">NEU</span>';
    if (s === "DONE") return '<span class="badge done">ERLEDIGT</span>';
    return '<span class="badge other">'+esc(s)+'</span>';
  }

  function parseItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map(it => ({
      id: String(it?.id ?? ""),
      qty: Number(it?.qty ?? 1) || 1,
      name: String(it?.name ?? it?.title ?? ""),
      price: it?.price
    }));
  }

  function computeSig(orders) {
    return (orders || []).map(o =>
      String(o.key||"") + "|" + String(o.status||"") + "|" + String(o.tableId||"") + "|" + String(o.total||"") + "|" + String(o.note||"")
    ).join("||");
  }

  function normalizeOrder(o) {
    return {
      key: o.key || o.id || "",
      id: o.id || "",
      tableId: o.tableId ?? o.table ?? o.tisch ?? null,
      status: o.status || "NEW",
      note: o.note || "",
      total: o.total,
      items: parseItems(o.items),
    };
  }

  function applyFilters(orders) {
    const fTable = (el("filterTable").value || "").trim();
    const fText = (el("filterText").value || "").trim().toLowerCase();

    return orders.filter(o => {
      if (fTable && String(o.tableId) !== fTable) return false;
      if (fText) {
        const hay = (String(o.note||"") + " " + o.items.map(x => (x.name||x.id)+" x"+x.qty).join(" ")).toLowerCase();
        if (!hay.includes(fText)) return false;
      }
      return true;
    });
  }

  function renderOrders(rawOrders) {
    const orders = (rawOrders || []).map(normalizeOrder);

    // newest first by key (contains timestamp)
    orders.sort((a,b) => String(b.key).localeCompare(String(a.key)));

    state.orders = orders;

    const newCount = orders.filter(o => String(o.status).toUpperCase() === "NEW").length;
    const doneCount = orders.filter(o => String(o.status).toUpperCase() === "DONE").length;
    el("kpiCount").textContent = String(orders.length);
    el("kpiNew").textContent = "NEU: " + newCount;
    el("kpiDone").textContent = "ERLEDIGT: " + doneCount;

    const shown = applyFilters(orders);

    const host = el("ordersHost");
    if (!shown.length) {
      host.innerHTML = '<div class="empty">Keine Bestellungen (oder Filter aktiv).</div>';
      return;
    }

    host.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th style="width:90px">Tisch</th>
            <th style="width:110px">Status</th>
            <th>Artikel</th>
            <th style="width:180px">Notiz</th>
            <th style="width:120px">Summe</th>
            <th style="width:140px">ID</th>
          </tr>
        </thead>
        <tbody>
          ${shown.map(o => {
            const itemsHtml = o.items.length
              ? '<div class="items">' + o.items.map(it => `
                  <div class="itemline">
                    <div>${esc(it.name || it.id)}</div>
                    <div class="muted">x${esc(it.qty)}</div>
                  </div>`).join("") + '</div>'
              : '<span class="muted">–</span>';

            const total = (typeof o.total === "number")
              ? (o.total.toFixed(2).replace(".", ",") + " €")
              : (o.total ? esc(o.total) : "–");

            const note = o.note ? esc(o.note) : '<span class="muted">–</span>';
            const sid = esc(o.id || o.key || "");
            return `
              <tr>
                <td><strong>${esc(o.tableId ?? "–")}</strong></td>
                <td>${statusBadge(o.status)}</td>
                <td>${itemsHtml}</td>
                <td>${note}</td>
                <td><strong>${total}</strong></td>
                <td class="mono">${sid.slice(-14)}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  async function refresh() {
    if (!state.pin && !askPin(false)) {
      setStatus(false, "PIN fehlt");
      return;
    }
    try {
      const res = await fetch(API, {
        cache: "no-store",
        headers: { "Authorization": "Bearer " + state.pin }
      });

      if (!res.ok) {
        setStatus(false, "Fehler " + res.status);
        if (res.status === 401 || res.status === 403) {
          sessionStorage.removeItem(PIN_KEY);
          state.pin = null;
        }
        renderOrders([]);
        el("lastUpdate").textContent = "–";
        return;
      }

      const data = await res.json();
      const orders = Array.isArray(data.orders) ? data.orders : [];
      setStatus(true, "Verbunden");
      el("lastUpdate").textContent = "Update: " + nowText();

      const sig = computeSig(orders);
      state.lastSig = sig;

      renderOrders(orders);
    } catch (e) {
      setStatus(false, "Offline/Netz");
      console.error(e);
    }
  }

  function bindUi() {
    el("btnRefresh").addEventListener("click", refresh);
    el("btnPin").addEventListener("click", () => {
      sessionStorage.removeItem(PIN_KEY);
      state.pin = null;
      if (askPin(true)) refresh();
    });
    el("btnLogout").addEventListener("click", logout);
    el("btnAuto").addEventListener("click", () => setAuto(!state.auto));

    el("filterTable").addEventListener("input", () => renderOrders(state.orders));
    el("filterText").addEventListener("input", () => renderOrders(state.orders));
  }

  function init() {
    bindUi();
    state.auto = readAutoPref();
    setAuto(state.auto);
    askPin(false);
    refresh();
  }

  init();
})();