(() => {
  const LANGS = ["de"];

  const I18N = {
    de: {
      order:"Bestellen", call:"Bedienung rufen", pay:"Bezahlen", quiz:"Kaffee-Quiz", story:"Kaffee-Geschichte",
      home:"Home", search:"Suchen…", category:"Kategorie", all:"Alle", cart:"Warenkorb", empty:"Noch nichts ausgewählt.",
      total:"Summe", send:"Bestellung senden", clear:"Leeren", back:"Zurück", startQuiz:"Quiz starten",
      next:"Weiter", again:"Nochmal", correct:"Richtig.", wrong:"Falsch.", close:"Schließen",
      callText:"Wir informieren die Bedienung. (Demo ohne Backend)", payText:"",
      copied:"Bestellung erfolgreich übermittelt",
      home_order_sub:"", home_call_sub:"", home_pay_sub:"",
      home_extras:"Extras", home_extras_sub:"",
      modal_call_ok:"Bedienung wurde gerufen.",
      modal_pay_ok:"Bedienung wurde zur Bezahlung gerufen",
      no_results:"Keine Treffer.",
      opt_cold:"Kalt", opt_warm:"Warm",
      opt_pick_title:"Auswahl nötig",
      opt_pick_msg:"Bitte Kalt oder Warm auswählen.",
      note_label:"Anmerkungen (optional)",
      note_placeholder:"z.B. ohne Zucker, extra Eis, Allergiehinweis…",
      added_to_cart:"Zum Warenkorb hinzugefügt",
      extras_news:"Cloud9-Zeitung",
      news_title:"Cloud9-Zeitung",
      news_loading:"Lade News…",
      news_error:"News konnten nicht geladen werden.",
      news_open:"Öffnen",
      legal:"Hinweis",
      news_legal:"Es werden nur Überschriften/Teaser angezeigt.",
      news_cat_mix:"Mix",
      news_cat_world:"Welt",
      news_cat_weather:"Wetter",
      news_cat_business:"Wirtschaft",
      news_cat_sport:"Sport"
    }
  };

  const el = (id) => document.getElementById(id);
  const state = {
    lang: "de",
    menu: null,
    cart: [],
  };

  function money(v) {
    const n = typeof v === "number" ? v : 0;
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function hashRoute() {
    const h = (location.hash || "#/home").replace("#", "");
    return h.startsWith("/") ? h : "/home";
  }
  function navTo(route) { location.hash = route; }

  async function fetchJson(path) {
    const isMenuDe = (path === "menu.de.json" || path === "/menu.de.json");
    const url = isMenuDe ? path + "?v=" + Date.now() : path;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
    return res.json();
  }

  async function loadData() {
    state.menu = await fetchJson("menu.de.json");
  }

  function renderTabs() {
    const t = I18N.de;
    const tabs = [
      { r: "/home", label: t.home },
      { r: "/order", label: t.order },
      { r: "/call", label: t.call },
      { r: "/pay", label: t.pay }
    ];
    const host = el("tabs");
    host.innerHTML = "";
    const cur = hashRoute();
    for (const tb of tabs) {
      const b = document.createElement("button");
      b.className = "tab" + (cur === tb.r ? " active" : "");
      b.textContent = tb.label;
      b.onclick = () => navTo(tb.r);
      host.appendChild(b);
    }
  }

  function renderHome() {
    const t = I18N.de;
    return `<div class="card"><div class="h">Cloud9 Kaffee</div></div>`;
  }

  function renderOrder() {
    const t = I18N.de;
    const menu = state.menu;
    if (!menu) return `<div class="card">Lade Menü…</div>`;

    return `
      <div class="card">
        <div class="h">${t.order}</div>
        ${(menu.categories || []).map(c => `
          <h3>${c.title}</h3>
          ${(c.items || []).map(i => `
            <div class="row" style="justify-content:space-between">
              <div>${i.name}</div>
              <div>${money(i.price)}</div>
            </div>
          `).join("")}
        `).join("")}
      </div>
    `;
  }

  function renderRoute() {
    renderTabs();
    const view = el("view");
    const route = hashRoute();

    if (route === "/home") view.innerHTML = renderHome();
    else if (route === "/order") view.innerHTML = renderOrder();
    else view.innerHTML = renderHome();
  }

  async function renderAll() {
    try {
      await loadData();
      renderRoute();
    } catch (e) {
      el("view").innerHTML = `<div class="card">Fehler: ${e.message}</div>`;
      console.error(e);
    }
  }

  window.addEventListener("hashchange", renderRoute);
  renderAll();
})();