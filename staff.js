(() => {
  const API_LIST = "/api/staff/orders";
  const API_ACT  = "/api/staff/order";
  const API_REQ  = "/api/requests"; // public list of service requests


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
      // return HTML line (escaped)
      const line = `${qty}× ${name}${opt ? " (" + opt + ")" : ""}`;
      return safe(line);
    }).join("<br>");
  })();