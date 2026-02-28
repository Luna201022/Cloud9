(() => {
  const API_LIST = "/api/orders";
  const API_ACT  = "/api/staff/order";

  const LS_PIN = "cloud9_staff_pin";
  const LS_AUTO_ON = "cloud9_staff_auto_on";
  const LS_AUTO_EVERY = "cloud9_staff_auto_every";
  const LS_FILTER = "cloud9_staff_filter";
  const LS_SEEN = "cloud9_staff_seen_keys"; // JSON array of keys

  const el = (id) => document.getElementById(id);

  let audioEnabled = false;

  function toast(msg) {
    const t = el("toast");
    t.textContent = msg;
    t.style.display = "block";
    setTimeout(() => { t.style.display = "none"; }, 1200);
  }

  function money(v) {
    const n = typeof v === "number" ? v : Number(v || 0);
    return (isFinite(n) ? n : 0).toFixed(2).replace(".", ",") + " €";
  }

  function readPin() {
    return (localStorage.getItem(LS_PIN) || "").trim();
  }
  function savePin(pin) {
    localStorage.setItem(LS_PIN, (pin || "").trim());
  }

  function getSeenSet() {
    try {
      const arr = JSON.parse(localStorage.getItem(LS_SEEN) || "[]");
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }
  function setSeenSet(set) {
    try {
      localStorage.setItem(LS_SEEN, JSON.stringify(Array.from(set).slice(-500)));
    } catch {}
  }

  async function apiFetch(url, opts = {}) {
    const pin = readPin();
    const headers = Object.assign({}, opts.headers || {});
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    if (pin) headers["Authorization"] = "Bearer " + pin;

    const res = await fetch(url, { ...opts, headers, cache: "no-store" });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    if (!res.ok) {
      const msg = (json && json.error) ? json.error : (text || ("HTTP " + res.status));
      throw new Error(msg);
    }
    return json;
  }

  function summarizeItems(items) {
    if (!Array.isArray(items) || !items.length) return "";
    return items.map(it => {
      const qty = it.qty ?? it.quantity ?? 1;
      const name = it.name || it.id || "Artikel";
      const opt = it.options && typeof it.options === "object"
        ? Object.values(it.options).filter(Boolean).join(", ")
        : "";
      return `${qty}× ${name}${opt ? " (" + opt + ")" : ""}`;
    }).join(" — ");
  }

  function statusPill(status) {
    const s = (status || "NEW").toUpperCase();
    const cls = s === "DONE" ? "pill done" : "pill new";
    return `<span class="${cls}">${s}</span>`;
  }

  function safe(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function playBeep() {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.20, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.20);
      o.stop(ctx.currentTime + 0.22);
      setTimeout(() => { try { ctx.close(); } catch {} }, 300);
    } catch {}
  }

  function setError(msg) {
    el("error").textContent = msg || "";
  }

  function metaText(ok, ms, count) {
    const now = new Date();
    const ts = now.toLocaleTimeString();
    el("meta").textContent = `${ok ? "OK" : "Fehler"} • ${count} • ${ms} ms • ${ts}`;
  }

  function getFilter() {
    return localStorage.getItem(LS_FILTER) || "NEW";
  }
  function setFilter(v) {
    localStorage.setItem(LS_FILTER, v);
  }

  async function listOrders() {
    const t0 = performance.now();
    const data = await apiFetch(API_LIST, { method: "GET" });
    const ms = Math.round(performance.now() - t0);
    const orders = Array.isArray(data?.orders) ? data.orders : [];
    metaText(!!data?.ok, ms, orders.length);
    return orders;
  }

  async function actOrder(payload) {
    return apiFetch(API_ACT, { method: "POST", body: JSON.stringify(payload) });
  }

  function applyFilter(orders) {
    const f = getFilter();
    if (f === "ALL") return orders;
    const want = f.toUpperCase();
    return orders.filter(o => String(o.status || "NEW").toUpperCase() === want);
  }

  function render(orders) {
    const tbody = el("rows");
    const empty = el("empty");
    tbody.innerHTML = "";

    const filtered = applyFilter(orders);

    if (!filtered.length) {
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    for (const o of filtered) {
      const key = o.id || "";
      const itemsTxt = summarizeItems(o.items);
      const note = (o.note || "").trim();
      const total = o.total ?? 0;
      const st = (o.status || "NEW").toUpperCase();

      const tr = document.createElement("tr");
      tr.className = "tr";
      tr.innerHTML = `
        <td><b>${safe(o.tableId ?? "")}</b></td>
        <td>
          <div>${safe(itemsTxt)}</div>
          ${note ? `<div class="small2 muted">Notiz: ${safe(note)}</div>` : ``}
          <div class="small2 muted mono">${safe(key)}</div>
        </td>
        <td><b>${money(total)}</b></td>
        <td>${statusPill(st)}</td>
        <td class="row2" style="gap:8px">
          <button class="btn2 primary" type="button" data-done="${safe(key)}">Gesendet</button>
          <button class="btn2 danger" type="button" data-del="${safe(key)}">Löschen</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll("[data-done]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-done");
        btn.disabled = true;
        setError("");
        try {
          await actOrder({ key, status: "DONE" });
          toast("Auf DONE gesetzt");
          await fetchAndRender(true);
        } catch (e) {
          setError("DONE fehlgeschlagen: " + (e?.message || e));
        } finally {
          btn.disabled = false;
        }
      });
    });

    tbody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const key = btn.getAttribute("data-del");
        if (!confirm("Bestellung wirklich löschen?")) return;
        btn.disabled = true;
        setError("");
        try {
          await actOrder({ key, action: "delete" });
          toast("Gelöscht");
          await fetchAndRender(true);
        } catch (e) {
          setError("Löschen fehlgeschlagen: " + (e?.message || e));
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  let lastKeys = getSeenSet();

  async function fetchAndRender(isManual = false) {
    setError("");
    try {
      const orders = await listOrders();

      // NEW detection + sound
      const currentKeys = new Set(orders.map(o => o.id).filter(Boolean));
      const newKeys = [];
      for (const k of currentKeys) if (!lastKeys.has(k)) newKeys.push(k);

      const newOrders = orders.filter(o => newKeys.includes(o.id) && String(o.status||"NEW").toUpperCase() === "NEW");
      if (newOrders.length) playBeep();

      lastKeys = currentKeys;
      setSeenSet(currentKeys);

      render(orders);
    } catch (e) {
      setError(String(e?.message || e));
      metaText(false, 0, 0);
    }
  }

  let autoTimer = null;

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function startAuto() {
    stopAuto();
    const on = el("autoToggle").checked;
    if (!on) return;
    const every = Number(el("autoEvery").value || 5);
    autoTimer = setInterval(() => fetchAndRender(false), Math.max(3, every) * 1000);
  }

  function loadPrefs() {
    el("statusFilter").value = getFilter();
    el("autoToggle").checked = (localStorage.getItem(LS_AUTO_ON) || "1") === "1";
    el("autoEvery").value = localStorage.getItem(LS_AUTO_EVERY) || "5";
  }

  function wire() {
    loadPrefs();

    el("savePinBtn").addEventListener("click", () => {
      const pin = el("pinInput").value.trim();
      if (!pin) { toast("PIN fehlt"); return; }
      savePin(pin);
      el("pinInput").value = "";
      toast("PIN gespeichert");
      fetchAndRender(true);
    });

    el("reloadBtn").addEventListener("click", () => fetchAndRender(true));

    el("statusFilter").addEventListener("change", () => {
      setFilter(el("statusFilter").value);
      fetchAndRender(true);
    });

    el("autoToggle").addEventListener("change", () => {
      localStorage.setItem(LS_AUTO_ON, el("autoToggle").checked ? "1" : "0");
      startAuto();
    });

    el("autoEvery").addEventListener("change", () => {
      localStorage.setItem(LS_AUTO_EVERY, el("autoEvery").value);
      startAuto();
    });

    el("soundBtn").addEventListener("click", async () => {
      // unlock audio
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        await ctx.resume();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        g.gain.value = 0.0001;
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.01);
        setTimeout(() => { try { ctx.close(); } catch {} }, 50);
      } catch {}
      audioEnabled = true;
      toast("Sound aktiv");
    });

    fetchAndRender(true);
    startAuto();
  }

  window.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  wire();
})();