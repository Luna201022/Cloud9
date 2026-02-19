
(() => {
  const LANGS = ["de","en","fr","it","vi"];

  const I18N = {
    de: { order:"Bestellen", call:"Bedienung rufen", pay:"Bezahlen", quiz:"Kaffee-Quiz", story:"Kaffee-Geschichte",
          home:"Home", search:"Suchen…", category:"Kategorie", all:"Alle", cart:"Warenkorb", empty:"Noch nichts ausgewählt.",
          total:"Summe", send:"Bestellung senden", clear:"Leeren", back:"Zurück", startQuiz:"Quiz starten",
          next:"Weiter", again:"Nochmal", correct:"Richtig.", wrong:"Falsch.", close:"Schließen",
          callText:"Wir informieren die Bedienung. (Demo ohne Backend)", payText:"",
          copied:"Bestellung erfolgreich übermittelt",
          home_order_sub:"",
          home_call_sub:"",
          home_pay_sub:"",
          home_extras:"Extras",
          home_extras_sub:"",
    modal_call_ok:"Bedienung wurde gerufen.",
    modal_pay_ok:"Bedienung wurde zur Bezahlung gerufen"
  ,
    no_results:"Keine Treffer.",
    opt_cold:"Kalt",
    opt_warm:"Warm",
    opt_pick_title:"Auswahl nötig",
    opt_pick_msg:"Bitte Kalt oder Warm auswählen.",
    note_label:"Anmerkungen (optional)",
    note_ph:"z. B. ohne Zucker, extra Eis, wenig Milch …",
    note_placeholder:"z.B. ohne Zucker, extra Eis, Allergiehinweis…",
    choice_label:"Bitte auswählen",
    choice_pick_msg:"Bitte eine Option auswählen.",
    choice_multi_hint:"(Mehrfachauswahl möglich)",
    added_to_cart:"Zum Warenkorb hinzugefügt",
    extras_news:"Cloud9-Zeitung",
    news_title:"Cloud9-Zeitung",
    news_loading:"Lade News…",
    news_error:"News konnten nicht geladen werden.",
    news_open:"Öffnen",
    legal:"Hinweis",
    news_legal:"Es werden nur Überschriften/Teaser angezeigt. Mit Klick öffnet sich die Originalquelle.",
    news_cat_mix:"Mix",
    news_cat_world:"Welt",
    news_cat_weather:"Wetter",
    news_cat_business:"Wirtschaft",
    news_cat_sport:"Sport"
  },
    en: { order:"Order", call:"Call staff", pay:"Pay", quiz:"Coffee quiz", story:"Coffee story",
          home:"Home", search:"Search…", category:"Category", all:"All", cart:"Cart", empty:"Nothing selected yet.",
          total:"Total", send:"Send order", clear:"Clear", back:"Back", startQuiz:"Start quiz",
          next:"Next", again:"Again", correct:"Correct.", wrong:"Wrong.", close:"Close",
          callText:"We notify the staff. (Demo without backend)", payText:"",
          copied:"Order successfully submitted",
          home_order_sub:"",
          home_call_sub:"",
          home_pay_sub:"",
          home_extras:"Extras",
          home_extras_sub:"",
    modal_call_ok:"Waiter has been called.",
    modal_pay_ok:"Staff has been called for payment"
  ,
    no_results:"No results.",
    opt_cold:"Cold",
    opt_warm:"Hot",
    opt_pick_title:"Selection required",
    opt_pick_msg:"Please choose Cold or Hot.",
    note_label:"Notes (optional)",
    note_ph:"e.g., no sugar, extra ice, less milk …",
    note_placeholder:"e.g., no sugar, extra ice, allergy note…",
    choice_label:"Please choose",
    choice_pick_msg:"Please select an option.",
    choice_multi_hint:"(Multiple selection possible)",
    added_to_cart:"Added to cart",
    extras_news:"Cloud9-Zeitung",
    news_title:"Cloud9-Zeitung",
    news_loading:"Loading news…",
    news_error:"Could not load news.",
    news_open:"Open",
    legal:"Note",
    news_legal:"Only headlines/teasers are shown. Click opens the original source.",
    news_cat_mix:"Mix",
    news_cat_world:"World",
    news_cat_weather:"Weather",
    news_cat_business:"Business",
    news_cat_sport:"Sports"
  },
    fr: { order:"Commander", call:"Appeler le personnel", pay:"Payer", quiz:"Quiz café", story:"Histoire du café",
          home:"Accueil", search:"Rechercher…", category:"Catégorie", all:"Tout", cart:"Panier", empty:"Rien sélectionné.",
          total:"Total", send:"Envoyer la commande", clear:"Vider", back:"Retour", startQuiz:"Démarrer le quiz",
          next:"Suivant", again:"Rejouer", correct:"Correct.", wrong:"Faux.", close:"Fermer",
          callText:"Nous prévenons le service. (Démo sans backend)", payText:"",
          copied:"Commande envoyée avec succès",
          home_order_sub:"",
          home_call_sub:"",
          home_pay_sub:"",
          home_extras:"Extras",
          home_extras_sub:"",
    modal_call_ok:"Le serveur a été appelé.",
    modal_pay_ok:"Le personnel a été appelé pour le paiement"
  ,
    no_results:"Aucun résultat.",
    opt_cold:"Froid",
    opt_warm:"Chaud",
    opt_pick_title:"Sélection requise",
    opt_pick_msg:"Veuillez choisir Froid ou Chaud.",
    note_label:"Remarques (facultatif)",
    note_ph:"ex. sans sucre, plus de glace, moins de lait …",
    note_placeholder:"ex. sans sucre, glaçons en plus, allergie…",
    choice_label:"Veuillez choisir",
    choice_pick_msg:"Veuillez sélectionner une option.",
    choice_multi_hint:"(Sélection multiple possible)",
    added_to_cart:"Ajouté au panier",
    extras_news:"Cloud9-Zeitung",
    news_title:"Cloud9-Zeitung",
    news_loading:"Chargement…",
    news_error:"Impossible de charger les actualités.",
    news_open:"Ouvrir",
    legal:"Info",
    news_legal:"Seuls des titres/extraits sont affichés. Un clic ouvre la source originale.",
    news_cat_mix:"Mix",
    news_cat_world:"Monde",
    news_cat_weather:"Météo",
    news_cat_business:"Économie",
    news_cat_sport:"Sport"
  },
    it: { order:"Ordinare", call:"Chiama il personale", pay:"Paga", quiz:"Quiz sul caffè", story:"Storia del caffè",
          home:"Home", search:"Cerca…", category:"Categoria", all:"Tutte", cart:"Carrello", empty:"Nessuna selezione.",
          total:"Totale", send:"Invia ordine", clear:"Svuota", back:"Indietro", startQuiz:"Avvia quiz",
          next:"Avanti", again:"Riprova", correct:"Giusto.", wrong:"Sbagliato.", close:"Chiudi",
          callText:"Avvisiamo il personale. (Demo senza backend)", payText:"",
          copied:"Ordine inviato con successo",
          home_order_sub:"",
          home_call_sub:"",
          home_pay_sub:"",
          home_extras:"Extra",
          home_extras_sub:"",
    modal_call_ok:"Il personale è stato chiamato.",
    modal_pay_ok:"Il personale è stato chiamato per il pagamento"
  ,
    no_results:"Nessun risultato.",
    opt_cold:"Freddo",
    opt_warm:"Caldo",
    opt_pick_title:"Selezione richiesta",
    opt_pick_msg:"Scegli Freddo o Caldo.",
    note_label:"Note (opzionale)",
    note_ph:"es. senza zucchero, più ghiaccio, meno latte …",
    note_placeholder:"es. senza zucchero, ghiaccio extra, allergie…",
    choice_label:"Scegli",
    choice_pick_msg:"Seleziona un’opzione.",
    choice_multi_hint:"(Selezione multipla possibile)",
    added_to_cart:"Aggiunto al carrello",
    extras_news:"Cloud9-Zeitung",
    news_title:"Cloud9-Zeitung",
    news_loading:"Caricamento…",
    news_error:"Impossibile caricare le notizie.",
    news_open:"Apri",
    legal:"Nota",
    news_legal:"Mostriamo solo titoli/anteprime. Il clic apre la fonte originale.",
    news_cat_mix:"Mix",
    news_cat_world:"Mondo",
    news_cat_weather:"Meteo",
    news_cat_business:"Economia",
    news_cat_sport:"Sport"
  },
    vi: { order:"Đặt món", call:"Gọi nhân viên", pay:"Thanh toán", quiz:"Đố vui cà phê", story:"Câu chuyện cà phê",
          home:"Trang chủ", search:"Tìm…", category:"Danh mục", all:"Tất cả", cart:"Giỏ hàng", empty:"Chưa chọn món nào.",
          total:"Tổng", send:"Gửi đơn", clear:"Xóa", back:"Quay lại", startQuiz:"Bắt đầu",
          next:"Tiếp", again:"Làm lại", correct:"Đúng.", wrong:"Sai.", close:"Đóng",
          callText:"Đã báo nhân viên. (Bản demo, chưa có backend)", payText:"",
          copied:"Đã gửi đơn hàng thành công",
          home_order_sub:"",
          home_call_sub:"",
          home_pay_sub:"",
          home_extras:"Tiện ích",
          home_extras_sub:"",
    modal_call_ok:"Đã gọi nhân viên phục vụ.",
    modal_pay_ok:"Đã gọi nhân viên để thanh toán"
  ,
    no_results:"Không có kết quả.",
    opt_cold:"Lạnh",
    opt_warm:"Nóng",
    opt_pick_title:"Cần chọn",
    opt_pick_msg:"Vui lòng chọn Lạnh hoặc Nóng.",
    note_label:"Ghi chú (tuỳ chọn)",
    note_ph:"vd: không đường, thêm đá, ít sữa …",
    note_placeholder:"vd: không đường, thêm đá, dị ứng…",
    choice_label:"Vui lòng chọn",
    choice_pick_msg:"Vui lòng chọn một tùy chọn.",
    choice_multi_hint:"(Có thể chọn nhiều)",
    added_to_cart:"Đã thêm vào giỏ hàng",
    extras_news:"Cloud9-Zeitung",
    news_title:"Cloud9-Zeitung",
    news_loading:"Đang tải tin…",
    news_error:"Không tải được tin tức.",
    news_open:"Mở",
    legal:"Lưu ý",
    news_legal:"Chỉ hiển thị tiêu đề/tóm tắt. Bấm để mở nguồn gốc.",
    news_cat_mix:"Tổng hợp",
    news_cat_world:"Thế giới",
    news_cat_weather:"Thời tiết",
    news_cat_business:"Kinh tế",
    news_cat_sport:"Thể thao"
  }
  };

  const el = (id) => document.getElementById(id);
  const state = {
    lang: loadLang(),
    menu: null,
    quiz: null,
    story: null,
    cart: [],
    quizIdx: 0,
    quizScore: 0,
    quizDone: false,
    // quiz session state (no persistence)
    quizStarted: false,
    quizSession: null,
  };

  const QUIZ_SESSION_SIZE = 20;

  function shuffleInPlace(arr) {
    // Fisher–Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startQuizSession() {
    const all = Array.isArray(state.quiz) ? state.quiz : [];
    const pool = all.slice();
    shuffleInPlace(pool);
    // Always build a 20-question session (duplicates only if there aren't enough unique questions).
    if (pool.length === 0) {
      state.quizSession = [];
    } else if (pool.length >= QUIZ_SESSION_SIZE) {
      state.quizSession = pool.slice(0, QUIZ_SESSION_SIZE);
    } else {
      const session = pool.slice();
      while (session.length < QUIZ_SESSION_SIZE) {
        session.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      state.quizSession = session;
    }
    state.quizIdx = 0;
    state.quizStarted = true;
  }

  function loadLang() {
    const fromLs = localStorage.getItem("cloud9_lang");
    if (fromLs && LANGS.includes(fromLs)) return fromLs;
    return "de";
  }
  function setLang(lang) {
    state.lang = lang;
    localStorage.setItem("cloud9_lang", lang);
    document.documentElement.lang = lang;
    renderAll();
  }

  function money(v) {
    const n = typeof v === "number" ? v : 0;
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function hashRoute() {
    const h = (location.hash || "#/home").replace("#", "");
    return h.startsWith("/") ? h : "/home";
  }
  function navTo(route) {
    location.hash = route;
  }

  // Robust JSON fetch: force UTF-8 decoding regardless of server headers.
  // This prevents Vietnamese diacritics from turning into replacement chars (�)
  // when the host serves JSON with a wrong charset.
  async function fetchJson(path) {
  // Nur DE-Menü: immer frisch laden (kein Cache, sofortige Admin-Änderungen sichtbar)
  const isDeMenu = (path === "menu.de.json" || path === "/menu.de.json");
  const url = isDeMenu ? (path + (path.includes("?") ? "&" : "?") + "v=" + Date.now()) : path;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + path);

  const buf = await res.arrayBuffer();
  const txt = new TextDecoder("utf-8").decode(buf);
  return JSON.parse(txt);
}

function bindNews() {
  const host = document.getElementById("newsCats");
  if (!host) return;

  host.querySelectorAll("[data-newscat]").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.getAttribute("data-newscat");
      state.newsCat = cat;
      localStorage.setItem("cloud9_news_cat", cat);

      host.querySelectorAll("[data-newscat]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      loadNewsIntoList();
    });
  });

  loadNewsIntoList();
}

async function loadNewsIntoList() {
  const t = I18N[state.lang] || I18N.de;
  const list = document.getElementById("newsList");
  if (!list) return;

  list.innerHTML = `<div class="small">${t.news_loading || "Loading news..."}</div>`;

  const max = 20;
  const cat = state.newsCat || "mix";
  const url = `/api/news?lang=${encodeURIComponent(state.lang)}&max=${max}&cat=${encodeURIComponent(cat)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const itemsRaw = Array.isArray(data.items) ? data.items : [];

    // de-duplicate by link
    const seen = new Set();
    const items = [];
    for (const it of itemsRaw) {
      const link = (it.link || "").trim();
      if (!link || seen.has(link)) continue;
      seen.add(link);
      items.push(it);
      if (items.length >= max) break;
    }

    if (!items.length) {
      list.innerHTML = `<div class="small">${t.news_error || "Could not load news."}</div>`;
      return;
    }

    list.innerHTML = items.map(it => {
      const link = escapeHtml(it.link || "");
      const src = escapeHtml(it.source || "");
      const teaser = escapeHtml(it.description || "");
      const dt = it.date || it.pubDate || it.updated || "";
      let dtText = "";
      if (dt) {
        try { dtText = new Date(dt).toLocaleString(); } catch { dtText = String(dt); }
      }
      return `
        <div class="card" style="margin-top:10px">
          <div class="row" style="justify-content:space-between; gap:10px; align-items:flex-start">
            <div style="min-width:0">
              <div style="font-weight:700">${escapeHtml(it.title || "")}</div>
              ${teaser ? `<div class="small" style="margin-top:6px">${teaser}</div>` : ``}
              <div class="small" style="opacity:.8; margin-top:6px">${src}${dtText ? " • " + escapeHtml(dtText) : ""}</div>
            </div>
            <a class="btn" href="${link}" target="_blank" rel="noopener">${t.news_open || "Open"}</a>
          </div>
        </div>
      `;
    }).join("");

  } catch (e) {
    list.innerHTML = `<div class="small">${t.news_error || "Could not load news."}<br><span style="opacity:.75">${escapeHtml(String(e?.message||e))}</span></div>
      <div class="small" style="opacity:.7;margin-top:6px">API: <a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></div>`;
  }
}


function renderRoute() {
    const route = hashRoute();

    // Quiz should not be remembered when leaving the quiz page.
    if (route !== "/quiz" && state.quizStarted) {
      state.quizStarted = false;
      state.quizIdx = 0;
      state.quizSession = null;
    }

    renderTabs();
    const view = el("view");
    if (route === "/home") view.innerHTML = renderHome();
    else if (route === "/order") { view.innerHTML = renderOrder(); bindOrder(); }
    else if (route === "/call") {
      view.innerHTML = renderCall();
      // Popup as soon as the guest opens this page.
      setTimeout(() => window.callWaiter && window.callWaiter(), 0);
    }
    else if (route === "/pay") {
      view.innerHTML = renderPay();
      // Popup as soon as the guest opens this page.
      setTimeout(() => window.requestPayment && window.requestPayment(), 0);
    }
    else if (route === "/quiz") { view.innerHTML = renderQuiz(); bindQuiz(); }
    else if (route === "/story") view.innerHTML = renderStory();
    else if (route === "/news") {
      // renderNews() is async; don't write a Promise into the DOM
      view.innerHTML = `<div class="card"><div class="h">Cloud9-Zeitung</div><div class="small">Lade...</div></div>`;
      renderNews().then((html) => {
        view.innerHTML = html;
        try { bindNews(); } catch(e) { console.error(e); }
      }).catch((err) => {
        console.error(err);
        view.innerHTML = `<div class="card"><div class="h">Cloud9-Zeitung</div><div class="small">News konnten nicht geladen werden.</div></div>`;
      });
    }
    else { navTo("/home"); }
  }

  async function renderAll() {
    renderLangButtons();
    try {
      await loadData();
    } catch (e) {
      el("view").innerHTML = `<div class="card">Fehler beim Laden: ${escapeHtml(e.message)}</div>`;
      return;
    }
    renderRoute();
  }

  // modal bindings
  
function callWaiter(){
  const t = I18N[state.lang] || I18N.de;
  openModal(t.call, t.modal_call_ok);
}
function requestPayment(){
  const t = I18N[state.lang] || I18N.de;
  openModal(t.pay, t.modal_pay_ok);
}

// Expose for inline onclick handlers in HTML.
window.callWaiter = callWaiter;
window.requestPayment = requestPayment;

window.addEventListener("hashchange", () => renderRoute());
  el("modalClose").onclick = closeModal;
  el("modalBackdrop").addEventListener("click", (ev) => { if (ev.target === el("modalBackdrop")) closeModal(); });

  renderAll();
})();
