(() => {
  const API_LIST = "/api/staff/orders";
  const API_ACTION = "/api/staff/order";
  const REFRESH_MS = 3000;

  const $ = (id) => document.getElementById(id);

  const state = {
    pin: "",
    timer: null,
    lastFetchMs: 0,
    lastOkMs: 0,
    orders: [],
  };

  function loadPin() {
    try { return localStorage.getItem("cloud9_staff_pin") || ""; } catch { return ""; }
  }
  function savePin(pin) {
    try { localStorage.setItem("cloud9_staff_pin", pin); } catch {}
  }

  function setMeta(text) {
    $("meta").textContent = text;
  }

  function authHeaders() {
    const pin = state.pin.trim();
    return pin ? { Authorization: `Bearer ${pin}` } : {};
  }

  async function apiGetOrders() {
    const t0 = performance.now();
    const res = await fetch(API_LIST, { headers: authHeaders(), cache: "no-store" });
    const t1 = performance.now();
    state.lastFetchMs = Math.round(t1 - t0);

    // Always try to parse json (even on errors)
    let data = null;
    try { data = await res.json(); } catch { data = null; }

    if (!res.ok || !data || data.ok === false) {
      const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    state.lastOkMs = state.lastFetchMs;
    return data.orders || [];
  }

  function normStatus(s) {
    const v = String(s || "").toUpperCase();
    return (v === "DONE" || v === "NEW") ? v : "NEW";
  }

  function matchesFilters(o) {
    const tf = ($("tableFilter").value || "").trim();
    if (tf) {
      const num = Number(tf);
      if (!Number.isNaN(num) && Number(o.tableId) !== num) return false;
    }
    const sf = $("statusFilter").value;
    if (sf && sf !== "all") {
      if (normStatus(o.status) !== sf) return false;
    }
    return true;
  }

  function moneyEUR(v) {
    const n = typeof v === "number" ? v : Number(v || 0);
    return (Number.isFinite(n) ? n : 0).toFixed(2).replace(".", ",") + " €";
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function render() {
    const host = $("orders");
    const all = Array.isArray(state.orders) ? state.orders : [];
    const shown = all.filter(matchesFilters);

    const countAll = all.length;
    const countShown = shown.length;

    setMeta(`OK • ${countAll} gesamt • ${countShown} angezeigt • ${state.lastOkMs || state.lastFetchMs} ms`);

    if (!shown.length) {
      host.innerHTML = `<div class="small muted">Keine Bestellungen.</div>`;
      return;
    }

    host.innerHTML = shown.map(o => {
      const st = normStatus(o.status);
      const badgeCls = st === "DONE" ? "badge done" : "badge new";
      const lines = Array.isArray(o.items) ? o.items : [];
      return `
        <div class="order">
          <div class="orderHead">
            <div>
              <div style="font-weight:900">Tisch ${esc(o.tableId)}</div>
              <div class="small muted">${esc(o.createdAt || "")}</div>
              <div class="k">Key: ${esc(o.key || "")}</div>
            </div>
            <div class="row2" style="justify-content:flex-end">
              <span class="${badgeCls}">${st}</span>
              <button class="btn2 primary" data-done="${esc(o.key || "")}">Fertig</button>
              <button class="btn2 danger" data-del="${esc(o.key || "")}">Löschen</button>
            </div>
          </div>

          <div class="sep"></div>

          <div class="lines">
            ${lines.map(li => `
              <div class="line">
                <div style="min-width:0">
                  <div style="font-weight:700">${esc(li.name || li.id || "")}</div>
                  ${li.options && Object.keys(li.options).length ? `<div class="small muted">${esc(JSON.stringify(li.options))}</div>` : ``}
                </div>
                <div class="row2" style="justify-content:flex-end">
                  <div class="small">x${esc(li.qty ?? 1)}</div>
                  <div style="font-weight:900">${moneyEUR(li.unitPrice ?? 0)}</div>
                </div>
              </div>
            `).join("")}
          </div>

          ${o.note ? `<div class="sep"></div><div class="small"><b>Note:</b> ${esc(o.note)}</div>` : ``}

          <div class="sep"></div>
          <div class="row2" style="justify-content:space-between">
            <div class="small muted">ID: ${esc(o.id || "")}</div>
            <div style="font-weight:900">${moneyEUR(o.total ?? 0)}</div>
          </div>
        </div>
      `;
    }).join("");

    host.querySelectorAll("[data-done]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-done");
        await doAction({ key, status: "DONE" });
      });
    });
    host.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-del");
        await doAction({ key, action: "delete" });
      });
    });
  }

  async function doAction(body) {
    if (!state.pin.trim()) {
      alert("PIN fehlt.");
      return;
    }
    const res = await fetch(API_ACTION, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok || !data || data.ok === false) {
      alert(`Fehler: ${(data && data.error) ? data.error : "HTTP " + res.status}`);
      return;
    }
    // refresh immediately after action
    await refresh();
  }

  async function refresh() {
    const host = $("orders");
    try {
      const orders = await apiGetOrders();
      state.orders = orders;
      render();
    } catch (e) {
      setMeta(`Fehler • ${state.lastFetchMs} ms`);
      host.innerHTML = `<div class="small muted">Fehler: ${esc(e?.message || String(e))}</div>`;
    }
  }

  function startTimer() {
    stopTimer();
    state.timer = setInterval(() => {
      if ($("autoRefresh").checked) refresh();
    }, REFRESH_MS);
  }
  function stopTimer() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }

  function bind() {
    // Load PIN from storage but do NOT display it in plaintext:
    // input is type=password, so user won't see it.
    state.pin = loadPin();
    $("pin").value = state.pin;

    $("savePin").addEventListener("click", () => {
      state.pin = $("pin").value || "";
      savePin(state.pin);
      refresh();
    });
    $("reload").addEventListener("click", () => {
      state.pin = $("pin").value || "";
      refresh();
    });

    $("tableFilter").addEventListener("input", render);
    $("statusFilter").addEventListener("change", render);

    $("autoRefresh").addEventListener("change", () => {
      // if toggled on, refresh immediately
      if ($("autoRefresh").checked) refresh();
    });

    $("refreshSec").textContent = String(Math.round(REFRESH_MS/1000));

    startTimer();
    refresh();
  }

  document.addEventListener("DOMContentLoaded", bind);
})();