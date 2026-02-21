(() => {
  const API_LIST = "/api/staff/orders";
  const API_ACTION = "/api/staff/order";

  const REFRESH_MS = 4000;
  const TIMEOUT_MS = 12000;

  const el = (id) => document.getElementById(id);

  let pinToken = "";
  let timer = null;
  let inFlight = false;
  let lastRenderKeys = new Set();

  function nowStr() {
    try { return new Date().toLocaleTimeString(); } catch { return ""; }
  }

  function setStatus(ok, msg) {
    const dot = el("dot");
    const label = el("refreshLabel");
    if (!dot || !label) return;
    dot.classList.remove("ok","bad");
    dot.classList.add(ok ? "ok" : "bad");
    label.textContent = msg;
  }

  function setLastUpdate(text) {
    const n = el("lastUpdate");
    if (n) n.textContent = text || "—";
  }

  function showErr(msg) {
    const e = el("err");
    if (!e) return;
    if (!msg) { e.style.display = "none"; e.textContent = ""; return; }
    e.style.display = "block";
    e.textContent = msg;
  }

  function getFilter() {
    const f = el("filter");
    return (f && f.value) ? f.value : "NEW";
  }

  function headers() {
    const h = { "Accept": "application/json" };
    if (pinToken) h["Authorization"] = "Bearer " + pinToken;
    return h;
  }

  async function fetchJson(url, opts = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal, cache: "no-store" });
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const data = ct.includes("application/json") ? await res.json() : await res.text();
      if (!res.ok) {
        const msg = (data && data.error) ? data.error : (typeof data === "string" ? data : ("HTTP " + res.status));
        throw new Error(msg);
      }
      return data;
    } finally {
      clearTimeout(t);
    }
  }

  function money(v) {
    const n = typeof v === "number" ? v : 0;
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function formatItems(items) {
    if (!Array.isArray(items) || !items.length) return "<div class='muted small2'>—</div>";
    return items.map(it => {
      const qty = (it.qty ?? 1);
      const name = it.name || it.id || "—";
      const opt = it.options ? JSON.stringify(it.options) : "";
      const up = (typeof it.unitPrice === "number") ? money(it.unitPrice) : "";
      return `<div class="small2">${escapeHtml(String(qty))}× <b>${escapeHtml(name)}</b> ${up ? `<span class="muted">(${up})</span>` : ""} ${opt ? `<span class="muted">${escapeHtml(opt)}</span>` : ""}</div>`;
    }).join("");
  }

  function statusTag(status) {
    const s = (status || "NEW").toUpperCase();
    const cls = "statusTag status" + s;
    return `<span class="${cls}">${escapeHtml(s)}</span>`;
  }

  function renderTable(orders) {
    const tbl = el("tbl");
    const empty = el("empty");
    if (!tbl) return;

    const filter = getFilter();
    let list = Array.isArray(orders) ? orders.slice() : [];
    if (filter === "NEW") list = list.filter(o => (o.status || "NEW").toUpperCase() === "NEW");
    if (filter === "DONE") list = list.filter(o => (o.status || "").toUpperCase() === "DONE");

    if (!list.length) {
      tbl.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";

    list.sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    tbl.innerHTML = `
      <tbody>
        ${list.map(o => {
          const key = o.key || "";
          const id = o.id || "";
          const tableId = o.tableId ?? "—";
          const note = (o.note || "").trim();
          const total = money(o.total ?? 0);
          const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : "—";
          const updated = o.updatedAt ? new Date(o.updatedAt).toLocaleString() : "—";
          const st = (o.status || "NEW").toUpperCase();

          return `
            <tr class="tr" data-key="${escapeHtml(key)}">
              <td style="width:160px">
                <div style="font-weight:900;font-size:18px">Tisch ${escapeHtml(String(tableId))}</div>
                <div class="small2 muted">Total: <b>${escapeHtml(total)}</b></div>
                <div style="margin-top:8px">${statusTag(st)}</div>
              </td>
              <td>
                <div style="font-weight:700;margin-bottom:6px">Artikel</div>
                ${formatItems(o.items)}
                ${note ? `<div style="margin-top:10px"><div class="small2 muted">Notiz</div><div>${escapeHtml(note)}</div></div>` : ""}
                <div style="margin-top:10px" class="small2 muted">
                  <div>Created: ${escapeHtml(created)}</div>
                  <div>Updated: ${escapeHtml(updated)}</div>
                  <div class="mono">Key: ${escapeHtml(key)}</div>
                  <div class="mono">ID: ${escapeHtml(id)}</div>
                </div>
              </td>
              <td style="width:220px">
                <div class="actions">
                  <button class="btn primary" data-done="${escapeHtml(key)}" ${st==="DONE" ? "disabled" : ""}>DONE</button>
                  <button class="btn danger" data-del="${escapeHtml(key)}">Löschen</button>
                </div>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    `;

    tbl.querySelectorAll("[data-done]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-done");
        if (!key) return;
        await act(key, "DONE");
      });
    });
    tbl.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-del");
        if (!key) return;
        if (!confirm("Bestellung wirklich löschen?")) return;
        await act(key, "delete");
      });
    });

    const keys = new Set(list.map(o => o.key).filter(Boolean));
    const isFirst = lastRenderKeys.size === 0;
    let newCount = 0;
    if (!isFirst) {
      for (const k of keys) if (!lastRenderKeys.has(k)) newCount++;
    }
    lastRenderKeys = keys;
    if (newCount > 0) setStatus(true, `Auto-Refresh: OK (+${newCount} neu)`);
  }

  async function act(key, statusOrAction) {
    if (!pinToken) { showErr("PIN fehlt. Erst PIN speichern."); return; }
    showErr("");
    try {
      const payload = (statusOrAction === "delete")
        ? { key, action: "delete" }
        : { key, status: statusOrAction };

      await fetchJson(API_ACTION, {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      await loadOrders(true);
    } catch (e) {
      showErr("Aktion fehlgeschlagen: " + (e?.message || e));
      setStatus(false, "Auto-Refresh: Fehler");
    }
  }

  async function loadOrders(force = false) {
    if (inFlight && !force) return;
    if (!pinToken) { setStatus(false, "Auto-Refresh: PIN fehlt"); return; }

    inFlight = true;
    showErr("");
    try {
      const data = await fetchJson(API_LIST, { headers: headers() });
      renderTable(data.orders || []);
      setLastUpdate(nowStr());
      setStatus(true, "Auto-Refresh: OK");
    } catch (e) {
      showErr("Laden fehlgeschlagen: " + (e?.message || e));
      setStatus(false, "Auto-Refresh: Fehler");
    } finally {
      inFlight = false;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    if (!pinToken) { setStatus(false, "Auto-Refresh: PIN fehlt"); return; }
    loadOrders(true);
    timer = setInterval(() => loadOrders(false), REFRESH_MS);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) loadOrders(true);
    });
  }

  function stopAutoRefresh() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function initPin() {
    const saved = localStorage.getItem("cloud9_admin_pin") || "";
    pinToken = saved.trim();
    if (pinToken) setStatus(true, "Auto-Refresh: bereit");
    else setStatus(false, "Auto-Refresh: PIN fehlt");

    const saveBtn = el("savePin");
    const pinInput = el("pin");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const v = (pinInput?.value || "").trim();
        if (!v) { showErr("PIN eingeben und dann speichern."); return; }
        localStorage.setItem("cloud9_admin_pin", v);
        pinToken = v;
        if (pinInput) pinInput.value = ""; // nicht anzeigen!
        showErr("");
        startAutoRefresh();
      });
    }

    const reloadBtn = el("reload");
    if (reloadBtn) reloadBtn.addEventListener("click", () => loadOrders(true));

    const filter = el("filter");
    if (filter) filter.addEventListener("change", () => loadOrders(true));
  }

  initPin();
  if (pinToken) startAutoRefresh();
})();