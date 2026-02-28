(() => {
  "use strict";

  // ===== CONFIG =====
  const API_LIST = "/api/staff/orders";
  const API_ACTION = "/api/staff/order";
  const AUTO_REFRESH_MS = 5000; // 5s (D1, keine KV-Limits mehr relevant)
  const LS_PIN = "cloud9_staff_pin";

  // ===== DOM =====
  const $ = (id) => document.getElementById(id);

  const elPin = $("pin");
  const elSavePin = $("btnSavePin");
  const elReload = $("btnReload");
  const elTableFilter = $("tableFilter");
  const elStatusFilter = $("filter");
  const elDot = $("dot");
  const elLast = $("lastUpdate");
  const elEmpty = $("empty");
  const elTbl = $("tbl");
  const elToast = $("toast");

  // ===== STATE =====
  const state = {
    pin: "",
    orders: [],
    seenNewKeys: new Set(),     // remembers NEW orders we've already beeped for
    audioUnlocked: false,
    audioCtx: null,
    nextPoll: null,
    lastFetchOk: null,
  };

  // ===== UTIL =====
  function nowStr() {
    try { return new Date().toLocaleTimeString(); } catch { return ""; }
  }

  function setStatus(ok, msg = "") {
    state.lastFetchOk = ok;
    if (elDot) elDot.className = "dot " + (ok ? "ok" : "bad");
    if (elLast) elLast.textContent = msg ? `${nowStr()} · ${msg}` : nowStr();
  }

  function toast(msg) {
    if (!elToast) return;
    elToast.textContent = msg;
    elToast.classList.add("show");
    setTimeout(() => elToast.classList.remove("show"), 1800);
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  // ===== SOUND (no file needed) =====
  function unlockAudio() {
    if (state.audioUnlocked) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      // Tiny silent buffer to "unlock" on some browsers
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.01);
      state.audioCtx = ctx;
      state.audioUnlocked = true;
    } catch (e) {
      // ignore
    }
  }

  function beep() {
    // Will only work reliably after a user gesture (PIN speichern / Neu laden / first click).
    try {
      unlockAudio();
      const ctx = state.audioCtx;
      if (!ctx) return;

      const t0 = ctx.currentTime;
      const makeTone = (freq, start, dur) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);

        // quick envelope
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        o.start(start);
        o.stop(start + dur + 0.02);
      };

      // pleasant double-beep
      makeTone(880, t0 + 0.00, 0.18);
      makeTone(660, t0 + 0.22, 0.22);
    } catch (e) {
      // ignore
    }
  }

  // ===== API =====
  async function apiFetch(path, options = {}) {
    const pin = state.pin || "";
    if (!pin) throw new Error("PIN fehlt");
    const headers = Object.assign({}, options.headers || {}, {
      "Authorization": "Bearer " + pin,
    });
    const res = await fetch(path, Object.assign({}, options, { headers, cache: "no-store" }));
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok || (data && data.ok === false)) {
      const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  async function fetchOrders() {
    const data = await apiFetch(API_LIST, { method: "GET" });
    const orders = Array.isArray(data.orders) ? data.orders : [];
    state.orders = orders;
    return orders;
  }

  async function setDone(key) {
    const body = JSON.stringify({ key, status: "DONE" });
    await apiFetch(API_ACTION, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  }

  async function delOrder(key) {
    const body = JSON.stringify({ key, action: "delete" });
    await apiFetch(API_ACTION, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  }

  // ===== RENDER =====
  function matchesFilters(o) {
    const tf = (elTableFilter?.value || "").trim();
    const sf = (elStatusFilter?.value || "ALL").trim().toUpperCase();

    if (tf) {
      const tableId = String(o.tableId ?? "");
      if (tableId !== tf) return false;
    }
    if (sf !== "ALL") {
      const st = String(o.status || "").toUpperCase();
      if (st !== sf) return false;
    }
    return true;
  }

  function render() {
    const filtered = (state.orders || []).filter(matchesFilters);

    if (elEmpty) elEmpty.style.display = filtered.length ? "none" : "block";
    if (!elTbl) return;

    // table header
    let html = `
      <tr>
        <th style="width:70px">Tisch</th>
        <th>Bestellung</th>
        <th style="width:90px">Summe</th>
        <th style="width:90px">Status</th>
        <th style="width:160px">Aktion</th>
      </tr>
    `;

    const money = (v) => {
      const n = typeof v === "number" ? v : Number(v || 0);
      return (isFinite(n) ? n : 0).toFixed(2).replace(".", ",") + " €";
    };

    const lineText = (o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      const lines = items.map(it => {
        const qty = it.qty ?? 1;
        const name = it.name || it.id || "";
        const opt = it.options && Object.keys(it.options).length
          ? " (" + Object.entries(it.options).map(([k,v]) => `${k}:${v}`).join(", ") + ")"
          : "";
        return `${qty}× ${name}${opt}`;
      });
      const note = (o.note || "").trim();
      return escapeHtml(lines.join(" · ") + (note ? ` — Notiz: ${note}` : ""));
    };

    for (const o of filtered) {
      const st = String(o.status || "NEW").toUpperCase();
      const stClass = st === "DONE" ? "badge done" : "badge new";
      const key = String(o.key || "");
      html += `
        <tr data-key="${escapeHtml(key)}">
          <td>${escapeHtml(o.tableId ?? "")}</td>
          <td style="word-break:break-word">${lineText(o)}</td>
          <td>${money(o.total)}</td>
          <td><span class="${stClass}">${escapeHtml(st)}</span></td>
          <td>
            <button class="btn2 primary" data-act="done" ${st==="DONE" ? "disabled" : ""}>Fertig</button>
            <button class="btn2 danger" data-act="del">Löschen</button>
          </td>
        </tr>
      `;
    }

    elTbl.innerHTML = html;

    // bind actions
    elTbl.querySelectorAll("button[data-act]").forEach(btn => {
      btn.addEventListener("click", async () => {
        unlockAudio(); // user gesture => allow future beeps
        const tr = btn.closest("tr");
        const key = tr?.getAttribute("data-key") || "";
        const act = btn.getAttribute("data-act");
        if (!key) return;

        btn.disabled = true;
        try {
          if (act === "done") await setDone(key);
          if (act === "del") await delOrder(key);
          toast(act === "del" ? "Gelöscht." : "Gesendet.");
          await refreshOnce(true);
        } catch (e) {
          toast("Fehler: " + (e?.message || e));
          setStatus(false, "Fehler");
          btn.disabled = false;
        }
      });
    });
  }

  // ===== POLL + NEW ORDER DETECT =====
  function detectAndBeepNew(orders) {
    // beep only for NEW status orders not seen before
    let newCount = 0;
    for (const o of orders) {
      const st = String(o.status || "NEW").toUpperCase();
      const key = String(o.key || "");
      if (!key) continue;
      if (st === "NEW" && !state.seenNewKeys.has(key)) {
        state.seenNewKeys.add(key);
        newCount++;
      }
    }
    if (newCount > 0) beep();
  }

  async function refreshOnce(fromUser = false) {
    try {
      if (fromUser) unlockAudio();
      const orders = await fetchOrders();
      setStatus(true, `Auto-Refresh: ${Math.round(AUTO_REFRESH_MS/1000)}s`);
      detectAndBeepNew(orders);
      render();
    } catch (e) {
      setStatus(false, (e?.message || "Fehler"));
      // keep render but show empty
      state.orders = [];
      render();
    }
  }

  function startPolling() {
    if (state.nextPoll) clearInterval(state.nextPoll);
    state.nextPoll = setInterval(() => refreshOnce(false), AUTO_REFRESH_MS);
  }

  // ===== INIT =====
  function init() {
    // default filters
    if (elStatusFilter && !elStatusFilter.value) elStatusFilter.value = "ALL";

    // load pin from localStorage (but do NOT display it)
    const saved = localStorage.getItem(LS_PIN) || "";
    state.pin = saved.trim();

    if (elPin) {
      elPin.value = "";              // never show PIN
      elPin.placeholder = "PIN";     // no "2010" hint
    }

    elSavePin?.addEventListener("click", () => {
      unlockAudio();
      const v = (elPin?.value || "").trim();
      if (!v) { toast("PIN fehlt."); return; }
      state.pin = v;
      localStorage.setItem(LS_PIN, v);
      if (elPin) elPin.value = ""; // clear field after saving
      toast("PIN gespeichert.");
      refreshOnce(true);
    });

    elReload?.addEventListener("click", () => {
      unlockAudio();
      refreshOnce(true);
    });

    elTableFilter?.addEventListener("input", () => render());
    elStatusFilter?.addEventListener("change", () => render());

    // also unlock audio on first click anywhere (mobile friendliness)
    window.addEventListener("click", unlockAudio, { once: true });

    refreshOnce(false);
    startPolling();
  }

  init();
})();