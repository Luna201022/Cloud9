(() => {
  const API_LIST = "/api/staff/orders";
  const API_ACTION = "/api/staff/order";
  const LS_PIN = "cloud9_staff_pin";

  const el = (id) => document.getElementById(id);

  function getPin() {
    return (el("pin").value || localStorage.getItem(LS_PIN) || "").trim();
  }

  function setMeta(text) {
    el("meta").textContent = text;
  }

  function moneyEUR(v) {
    const n = typeof v === "number" ? v : Number(v || 0);
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  async function apiGet(url) {
    const pin = getPin();
    if (!pin) throw new Error("PIN fehlt");
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + pin },
      cache: "no-store"
    });
    const txt = await res.text();
    let data = null;
    try { data = JSON.parse(txt); } catch {}
    if (!res.ok) throw new Error((data && data.error) ? data.error : ("HTTP " + res.status));
    return data ?? {};
  }

  async function apiPost(url, body) {
    const pin = getPin();
    if (!pin) throw new Error("PIN fehlt");
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + pin,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const txt = await res.text();
    let data = null;
    try { data = JSON.parse(txt); } catch {}
    if (!res.ok) throw new Error((data && data.error) ? data.error : ("HTTP " + res.status));
    return data ?? {};
  }

  function normalizeOrder(o) {
    const items = Array.isArray(o.items) ? o.items : [];
    return {
      key: o.key || "",
      id: o.id || "",
      tableId: Number(o.tableId ?? 0),
      note: o.note || "",
      total: (typeof o.total === "number") ? o.total : Number(o.total || 0),
      status: (o.status || "NEW").toUpperCase(),
      createdAt: o.createdAt || "",
      updatedAt: o.updatedAt || "",
      items
    };
  }

  function renderOrder(o) {
    const cls = "order " + (o.status === "DONE" ? "done" : "new");
    const badge = o.status === "DONE"
      ? '<span class="badge done">DONE</span>'
      : '<span class="badge new">NEW</span>';

    const when = (iso) => {
      if (!iso) return "";
      try { return new Date(iso).toLocaleString(); } catch { return iso; }
    };

    const lines = o.items.map(it => {
      const qty = Number(it.qty || 1);
      const name = it.name || it.id || "";
      const opts = it.options && typeof it.options === "object" ? it.options : {};
      const optParts = [];
      if (opts.temperature) optParts.push(opts.temperature);
      if (opts.size) optParts.push(opts.size);
      if (opts.choice) optParts.push(opts.choice);
      const optTxt = optParts.length ? (" • " + optParts.join(" • ")) : "";
      const unit = (typeof it.unitPrice === "number") ? it.unitPrice : Number(it.unitPrice || 0);
      const price = unit ? (" (" + moneyEUR(unit) + ")") : "";
      return `
        <div class="line">
          <div class="left">
            <div><b>${esc(qty)}×</b> ${esc(name)}${esc(optTxt)}${esc(price)}</div>
          </div>
          <div class="right"></div>
        </div>
      `;
    }).join("");

    const note = o.note ? `<div class="small"><b>Note:</b> ${esc(o.note)}</div>` : "";

    return `
      <div class="${cls}" data-key="${esc(o.key)}">
        <div class="orderHead">
          <div>
            <div style="font-weight:900;font-size:16px">Tisch ${esc(o.tableId || "?")} ${badge}</div>
            <div class="small muted">Gesamt: <b>${moneyEUR(o.total)}</b></div>
            <div class="small muted">${when(o.createdAt)}${o.updatedAt ? (" • upd " + when(o.updatedAt)) : ""}</div>
          </div>
          <div class="row2">
            ${o.status !== "DONE" ? `<button class="btn2 ok" data-done>Fertig</button>` : ``}
            <button class="btn2 danger" data-del>Löschen</button>
          </div>
        </div>
        <div class="lines">${lines || '<div class="small muted">Keine Items</div>'}</div>
        ${note}
        <div class="k" style="margin-top:10px">${esc(o.key)}</div>
      </div>
    `;
  }

  function applyFilters(orders) {
    const tVal = (el("tableFilter").value || "").trim();
    const sVal = el("statusFilter").value;

    let out = orders.slice();
    if (tVal) {
      const n = Number(tVal);
      if (!Number.isNaN(n)) out = out.filter(o => Number(o.tableId) === n);
    }
    if (sVal === "NEW") out = out.filter(o => o.status === "NEW");
    if (sVal === "DONE") out = out.filter(o => o.status === "DONE");
    return out;
  }

  function bindOrderActions() {
    el("orders").querySelectorAll("[data-key]").forEach(card => {
      const key = card.getAttribute("data-key");

      const doneBtn = card.querySelector("[data-done]");
      if (doneBtn) {
        doneBtn.addEventListener("click", async () => {
          doneBtn.disabled = true;
          try {
            await apiPost(API_ACTION, { key, status: "DONE" });
            await loadAndRender();
          } catch (e) {
            alert("Fehler: " + (e?.message || e));
          } finally {
            doneBtn.disabled = false;
          }
        });
      }

      const delBtn = card.querySelector("[data-del]");
      if (delBtn) {
        delBtn.addEventListener("click", async () => {
          if (!confirm("Bestellung wirklich löschen?")) return;
          delBtn.disabled = true;
          try {
            await apiPost(API_ACTION, { key, action: "delete" });
            await loadAndRender();
          } catch (e) {
            alert("Fehler: " + (e?.message || e));
          } finally {
            delBtn.disabled = false;
          }
        });
      }
    });
  }

  async function loadAndRender() {
    const host = el("orders");
    const start = Date.now();
    try {
      setMeta("Lade...");
      const data = await apiGet(API_LIST);
      const raw = Array.isArray(data.orders) ? data.orders : [];
      const orders = raw.map(normalizeOrder);

      // Sort: NEW first, then by createdAt desc
      orders.sort((a, b) => {
        const sa = a.status === "NEW" ? 0 : 1;
        const sb = b.status === "NEW" ? 0 : 1;
        if (sa !== sb) return sa - sb;
        const ta = Date.parse(a.createdAt || 0) || 0;
        const tb = Date.parse(b.createdAt || 0) || 0;
        return tb - ta;
      });

      const filtered = applyFilters(orders);
      if (!filtered.length) {
        host.innerHTML = '<div class="small muted">Keine Bestellungen.</div>';
      } else {
        host.innerHTML = filtered.map(renderOrder).join("");
        bindOrderActions();
      }

      const ms = Date.now() - start;
      setMeta(`OK • ${orders.length} gesamt • ${filtered.length} angezeigt • ${ms} ms`);
    } catch (e) {
      host.innerHTML = `<div class="small">Fehler: <b>${esc(e?.message || e)}</b><br/><span class="muted">Tipp: PIN prüfen, /api/staff/orders im Browser öffnen.</span></div>`;
      setMeta("Fehler");
    }
  }

  function init() {
    const saved = localStorage.getItem(LS_PIN);
    if (saved) el("pin").value = saved;

    el("savePin").addEventListener("click", () => {
      const p = (el("pin").value || "").trim();
      if (!p) return alert("PIN fehlt");
      localStorage.setItem(LS_PIN, p);
      alert("PIN gespeichert");
    });

    el("reload").addEventListener("click", loadAndRender);
    el("tableFilter").addEventListener("input", loadAndRender);
    el("statusFilter").addEventListener("change", loadAndRender);

    let timer = null;
    el("auto").addEventListener("change", () => {
      if (el("auto").checked) timer = setInterval(loadAndRender, 3000);
      else if (timer) { clearInterval(timer); timer = null; }
    });

    loadAndRender();
  }

  window.addEventListener("DOMContentLoaded", init);
})();