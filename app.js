
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
    extras_news:"News",
    news_title:"News",
    news_loading:"Lade News…",
    news_error:"News konnten nicht geladen werden.",
    news_open:"Öffnen",
    legal:"Hinweis",
    news_legal:"Es werden nur Überschriften/Teaser angezeigt. Mit Klick öffnet sich die Originalquelle."},
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
    extras_news:"News",
    news_title:"News",
    news_loading:"Loading news…",
    news_error:"Could not load news.",
    news_open:"Open",
    legal:"Note",
    news_legal:"Only headlines/teasers are shown. Click opens the original source."},
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
    extras_news:"Actualités",
    news_title:"Actualités",
    news_loading:"Chargement…",
    news_error:"Impossible de charger les actualités.",
    news_open:"Ouvrir",
    legal:"Info",
    news_legal:"Seuls des titres/extraits sont affichés. Un clic ouvre la source originale."},
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
    extras_news:"Notizie",
    news_title:"Notizie",
    news_loading:"Caricamento…",
    news_error:"Impossibile caricare le notizie.",
    news_open:"Apri",
    legal:"Nota",
    news_legal:"Mostriamo solo titoli/anteprime. Il clic apre la fonte originale."},
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
    extras_news:"Tin tức",
    news_title:"Tin tức",
    news_loading:"Đang tải tin…",
    news_error:"Không tải được tin tức.",
    news_open:"Mở",
    legal:"Lưu ý",
    news_legal:"Chỉ hiển thị tiêu đề/tóm tắt. Bấm để mở nguồn gốc."}
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
  };

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

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
    return res.json();
  }

  async function loadData() {
    const l = state.lang;
    const [menu, quiz, story] = await Promise.all([
      fetchJson(`menu.${l}.json`),
      fetchJson(`quiz.${l}.json`),
      fetchJson(`story.${l}.json`)
    ]);
    state.menu = menu;
    state.quiz = quiz;
    state.story = story;
  }

  function renderLangButtons() {
    const host = el("langBtns");
    host.innerHTML = "";
    for (const l of LANGS) {
      const b = document.createElement("button");
      b.className = "chip" + (state.lang === l ? " active" : "");
      b.textContent = l.toUpperCase();
      b.onclick = () => setLang(l);
      host.appendChild(b);
    }
  }

  function renderTabs() {
    const t = I18N[state.lang];
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

  function openModal(title, bodyHtml, footButtons = []) {
    el("modalTitle").textContent = title;
    el("modalBody").innerHTML = bodyHtml;
    const foot = el("modalFoot");
    foot.innerHTML = "";

    // If caller didn't supply footer buttons, provide a default close button.
    if (!footButtons || footButtons.length === 0) {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = I18N[state.lang].ok;
      b.onclick = closeModal;
      footButtons = [b];
    }

    for (const btn of footButtons) foot.appendChild(btn);
    el("modalBackdrop").classList.remove("hidden");
  }
  function closeModal() {
    el("modalBackdrop").classList.add("hidden");
  }

  function showAutoToast(msg) {
    try {
      openModal("", `<div class="toast">${msg}</div>`);
      setTimeout(() => {
        try { closeModal(); } catch(e) {}
      }, 1000);
    } catch (e) {
      // fallback: no modal available
      console.log(msg);
    }
  }

  function openChoiceModalSingle(item, onDone) {
    const t = I18N[state.lang] || I18N.de;
    const picked = { choice: null };

    const html = `
      <div class="optBox">
        <h3>${t.choice_label || "Bitte auswählen"}</h3>
        <div class="row" style="gap:8px; flex-wrap:wrap">
          ${(item.options.choice || []).map(o => `<button class="btn" data-choice="${escapeHtml(o.label)}">${escapeHtml(o.label)}</button>`).join("")}
        </div>
      </div>`;

    const cancel = document.createElement("button");
    cancel.className = "btn";
    cancel.textContent = t.cancel || "Schließen";
    cancel.onclick = () => closeModal();

    const ok = document.createElement("button");
    ok.className = "btn primary";
    ok.textContent = "OK";

    openModal(item.name, html, [cancel, ok]);

    const b = el("modalBody");
    b.querySelectorAll("[data-choice]").forEach(btn => {
      btn.onclick = () => {
        picked.choice = btn.getAttribute("data-choice");
        b.querySelectorAll("[data-choice]").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
      };
    });

    ok.onclick = () => {
      if (!picked.choice) {
        openModal(t.opt_pick_title || "Auswahl nötig", t.choice_pick_msg || "Bitte eine Option auswählen.");
        return;
      }
      closeModal();
      onDone(picked.choice);
    };
  }

  function openChoiceModalMulti(item, onDone) {
    const t = I18N[state.lang] || I18N.de;
    const picked = { choices: [] };

    const html = `
      <div class="optBox">
        <h3>${t.choice_label || "Bitte auswählen"}</h3>
        <div class="row" style="gap:8px; flex-wrap:wrap">
          ${(item.options.choice || []).map(o => `<button class="btn" data-choice="${escapeHtml(o.label)}">${escapeHtml(o.label)}</button>`).join("")}
        </div>
        <div class="small" style="margin-top:10px">${t.choice_multi_hint || ""}</div>
      </div>`;

    const cancel = document.createElement("button");
    cancel.className = "btn";
    cancel.textContent = t.cancel || "Schließen";
    cancel.onclick = () => closeModal();

    const ok = document.createElement("button");
    ok.className = "btn primary";
    ok.textContent = "OK";

    openModal(item.name, html, [cancel, ok]);

    const b = el("modalBody");
    b.querySelectorAll("[data-choice]").forEach(btn => {
      btn.onclick = () => {
        const val = btn.getAttribute("data-choice");
        const i = picked.choices.indexOf(val);
        if (i >= 0) {
          picked.choices.splice(i, 1);
          btn.classList.remove("active");
        } else {
          picked.choices.push(val);
          btn.classList.add("active");
        }
      };
    });

    ok.onclick = () => {
      if (!picked.choices.length) {
        openModal(t.opt_pick_title || "Auswahl nötig", t.choice_pick_msg || "Bitte eine Option auswählen.");
        return;
      }
      closeModal();
      onDone(picked.choices.slice());
    };
  }

  function cartTotal() {
    return state.cart.reduce((s, it) => s + it.price, 0);
  }
  function addToCart(item, pickedOptions = {}) {
    const line = {
      id: item.id,
      name: item.name,
      options: pickedOptions,
      price: calcItemPrice(item, pickedOptions)
    };
    state.cart.push(line);
    renderRoute();
      showAutoToast((I18N[state.lang]||I18N.de).added_to_cart || "Zum Warenkorb hinzugefügt");
}
  function calcItemPrice(item, pickedOptions) {
    let p = item.price || 0;
    if (item.options && item.options.size && pickedOptions.size) {
      const opt = item.options.size.find(o => o.label === pickedOptions.size);
      if (opt) p += opt.price_delta || 0;
    }
    // temperature no price delta
    return Math.round(p * 100) / 100;
  }
  function clearCart() {
    state.cart = [];
    state.orderNote = "";
    renderRoute();
  }

  function renderHome() {
    const t = I18N[state.lang];
    return `
      <div class="grid2">
        <div class="card">
          <div class="h">Cloud9 Kaffee</div>
          <div class="small">${t.order} • ${t.call} • ${t.pay}</div>

          <div class="homeCards">
            <button class="homeCard" onclick="location.hash='#/order'">
              <div class="ic"></div>
              <div class="ttl">${t.order}</div>
              <div class="sub">${t.home_order_sub}</div>
            </button>
            <button class="homeCard" onclick="callWaiter()">
              <div class="ic"></div>
              <div class="ttl">${t.call}</div>
              <div class="sub">${t.home_call_sub}</div>
            </button>
            <button class="homeCard" onclick="requestPayment()">
              <div class="ic"></div>
              <div class="ttl">${t.pay}</div>
              <div class="sub">${t.home_pay_sub}</div>
            </button>
          </div>
        </div>

        <div class="card">
          <div class="h">${t.home_extras}</div>
          <div class="homeCards">
            <button class="homeCard" onclick="location.hash='#/quiz'">
              <div class="ic"></div>
              <div class="ttl">${t.quiz}</div>
              <div class="sub"></div>
            </button>
            <button class="homeCard" onclick="location.hash='#/story'">
              <div class="ic"></div>
              <div class="ttl">${t.story}</div>
              <div class="sub"></div>
            </button>

<button class="homeCard" onclick="location.hash='#/news'">
  <div class="ic"></div>
  <div class="ttl">${t.extras_news || "News"}</div>
  <div class="sub"></div>
</button>
          </div>
    `;
  }

  function renderOrder() {
    const t = I18N[state.lang];
    const menu = state.menu;
    if (!menu) return `<div class="card">Loading…</div>`;

    const cats = menu.categories || [];
    const options = [`<option value="__all__">${t.all}</option>`]
      .concat(cats.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`)).join("");

    return `
      <div class="grid2">
        <div class="card">
          <div class="h">${t.order}</div>
          <div class="row">
            <input id="q" class="input" placeholder="${t.search}" />
            <select id="catSel">${options}</select>
          </div>
          <div id="menuList" class="list"></div>
        </div>
        <div class="card">
          <div class="h">${t.cart}</div>
          <div class="small">${state.cart.length ? "" : t.empty}</div>
          <div id="cartLines" class="list" style="margin-top:10px"></div>
          
          <div class="noteBlock">
            <div class="small">${t.note_label || "Anmerkungen"}</div>
            <textarea id="orderNote" class="textarea" rows="3" placeholder="${t.note_placeholder || "z.B. ohne Zucker, extra Eis, Allergiehinweis…"}">${escapeHtml(state.orderNote || "")}</textarea>
          </div>
          <div class="cartLine">
            <div>
              <div class="small">${t.total}</div>
              <div style="font-weight:900;font-size:20px">${money(cartTotal())}</div>
            </div>
            <div class="row" style="justify-content:flex-end">
              <button class="btn primary" id="sendBtn">${t.send}</button>
              <button class="btn danger" id="clearBtn">${t.clear}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindOrder() {
    const t = I18N[state.lang] || I18N.de;
    const q = document.getElementById("q");
    const catSel = document.getElementById("catSel");
    const renderMenuList = () => {
      const needle = (q.value || "").toLowerCase().trim();
      const cat = catSel.value;
      const cats = state.menu.categories || [];
      const shownCats = cat === "__all__" ? cats : cats.filter(c => c.id === cat);
      const groups = [];
      for (const c of shownCats) {
        const matched = [];
        for (const it of (c.items || [])) {
          const hay = (it.name + " " + (it.desc||"")).toLowerCase();
          if (!needle || hay.includes(needle)) matched.push(it);
        }
        if (matched.length) groups.push({cat: c, items: matched});
      }

      const host = document.getElementById("menuList");
      if (!groups.length) {
        host.innerHTML = `<div class="small">${t.no_results || "Keine Treffer."}</div>`;
        return;
      }

      // render grouped by category (like the physical menu)
      const idToItem = new Map();
      host.innerHTML = groups.map(g => {
        return `
          <div class="catBlock">
            <div class="catTitle">${escapeHtml(g.cat.title)}</div>
            ${g.items.map(item => {
              idToItem.set(item.id, item);
              const badges = [];
              if (item.options?.temperatur) badges.push(`<span class="badge">Warm/Kalt</span>`);
              if (item.options?.size) badges.push(`<span class="badge">0,5/0,7</span>`);
              return `
                <div class="item" data-item="${item.id}">
                  <div class="itemLeft" style="min-width:0">
                    <div class="itemTitle">${escapeHtml(item.name)}</div>
                    <div class="itemDesc">${item.desc ? escapeHtml(item.desc) : ""}</div>
                    <div class="row" style="margin-top:8px">
                      ${badges.join("")}
                      <button class="btn primary" data-add="${item.id}">+</button>
                    </div>
                  </div>
                  <div class="itemRight">
                    ${item.options?.size ? `<div class="price"></div>` : `<div class="price">${money(item.price || 0)}</div>`}
                    ${item.options?.temperatur ? `
                      <div class="optRow underPrice" data-opt="${item.id}" data-optkey="temperatur">
                        <button class="optBtn" data-optval="kalt">${t.opt_cold || "Kalt"}</button>
                        <button class="optBtn" data-optval="warm">${t.opt_warm || "Warm"}</button>
                      </div>
                    ` : ``}
                    ${item.options?.size ? `
                      <div class="optRow underPrice" data-opt="${item.id}" data-optkey="size">
                        ${item.options.size.map(o => `<button class="optBtn" data-optval="${o.label}">${o.label} (${money((item.price||0)+(o.price_delta||0))})</button>`).join("")}
                      </div>
                    ` : ``}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      }).join("");

      
host.querySelectorAll(".optRow .optBtn").forEach(btn => {
        btn.addEventListener("click", () => {
          const row = btn.closest(".optRow");
          row.querySelectorAll(".optBtn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });

host.querySelectorAll("[data-add]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-add");
          const item = idToItem.get(id);
          if (!item) return;


          // Special extras: milk alternatives (single) and toppings (multi)
          if (item.id === "milk_alt") {
            openChoiceModalSingle(item, (choice) => {
              addToCart(item, { choice });
            });
            return;
          }
          if (item.id === "topping") {
            openChoiceModalMulti(item, (choices) => {
              choices.forEach(lbl => {
                const line = {
                  id: item.id + ":" + lbl,
                  name: item.name + " (" + lbl + ")",
                  options: { choice: lbl },
                  price: Math.round((item.price || 0) * 100) / 100
                };
                state.cart.push(line);
              });
              renderRoute();
              showAutoToast((I18N[state.lang]||I18N.de).added_to_cart || "Zum Warenkorb hinzugefügt");
            });
            return;
          }

          let chosenTemp = null;
          if (item.options?.temperatur) {
            const row = btn.closest(".item")?.querySelector('.optRow[data-optkey="temperatur"]');
            const active = row?.querySelector(".optBtn.active");
            if (!active) {
              openModal(t.opt_pick_title || "Bitte wählen", t.opt_pick_msg || "Bitte Kalt oder Warm auswählen.");
              return;
            }
            chosenTemp = active.getAttribute("data-optval");
          }

          let chosenSize = null;
          if (item.options?.size) {
            const row = btn.closest(".item")?.querySelector('.optRow[data-optkey="size"]');
            const active = row?.querySelector(".optBtn.active");
            if (!active) {
              openModal(t.opt_pick_title || "Bitte wählen", t.opt_size_pick_msg || "Bitte Größe auswählen.");
              return;
            }
            chosenSize = active.getAttribute("data-optval");
          }


      
          // options dialog if needed
          const needsTemp = !!item.options?.temperatur;
          const needsSize = !!item.options?.size;

          // If the user already selected required options under the price, add directly without opening the popup.
          if (needsTemp && !needsSize && chosenTemp) {
            addToCart(item, { temperature: chosenTemp });
            return;
          }
          if (needsSize && !needsTemp && chosenSize) {
            addToCart(item, { size: chosenSize });
            return;
          }
          if (needsTemp && needsSize && chosenTemp && chosenSize) {
            addToCart(item, { temperature: chosenTemp, size: chosenSize });
            return;
          }

          if (!needsTemp && !needsSize) {
            addToCart(item, {});
            return;
          }

          const picked = { temperature: (chosenTemp || null), size: (chosenSize || null) };

          const tempHtml = needsTemp ? `
            <div class="chapter">
              <h3>Temperatur</h3>
              <div class="row">
                ${item.options.temperatur.map(v => `<button class="btn" data-temp="${v}">${v}</button>`).join("")}
              </div>
            </div>` : "";

          const sizeHtml = needsSize ? `
            <div class="chapter">
              <h3>Größe</h3>
              <div class="row">
                ${item.options.size.map(o => `<button class="btn" data-size="${o.label}">${o.label} (${money((item.price||0)+(o.price_delta||0))})</button>`).join("")}
              </div>
            </div>` : "";

          const ok = document.createElement("button");
          ok.className = "btn primary";
          ok.textContent = "OK";
          ok.onclick = () => {
            const chosen = {};
            if (needsTemp) chosen.temperature = picked.temperature || item.options.temperatur[0];
            if (needsSize) chosen.size = picked.size || item.options.size[0].label;
            closeModal();
            addToCart(item, chosen);
          };
          const cancel = document.createElement("button");
          cancel.className = "btn";
          cancel.textContent = I18N[state.lang].close;
          cancel.onclick = closeModal;

          openModal(item.name, tempHtml + sizeHtml, [cancel, ok]);

          const b = el("modalBody");
          if (needsTemp && picked.temperature) {
            b.querySelectorAll("[data-temp]").forEach(x => {
              if (x.getAttribute("data-temp") === picked.temperature) x.classList.add("active");
            });
          }
          b.querySelectorAll("[data-temp]").forEach(tbtn => {
            tbtn.onclick = () => {
              picked.temperature = tbtn.getAttribute("data-temp");
              b.querySelectorAll("[data-temp]").forEach(x => x.classList.remove("active"));
              tbtn.classList.add("active");
            };
          });
          b.querySelectorAll("[data-size]").forEach(sbtn => {
            sbtn.onclick = () => {
              picked.size = sbtn.getAttribute("data-size");
              b.querySelectorAll("[data-size]").forEach(x => x.classList.remove("active"));
              sbtn.classList.add("active");
            };
          });
        });
      });
    };

    q.addEventListener("input", renderMenuList);
    catSel.addEventListener("change", renderMenuList);
    renderMenuList();

    renderCartLines();

    const noteEl = document.getElementById("orderNote");
    if (noteEl) {
      noteEl.addEventListener("input", () => {
        state.orderNote = noteEl.value || "";
      });
    }


    document.getElementById("clearBtn").onclick = clearCart;
    document.getElementById("sendBtn").onclick = () => {
      const t = I18N[state.lang];
      if (!state.cart.length) return;
      const summary = state.cart.map(l => {
        const opt = [];
        if (l.options?.temperature) opt.push(l.options.temperature);
        if (l.options?.size) opt.push(l.options.size);
        return `- ${l.name}${opt.length ? " ("+opt.join(", ")+")" : ""} — ${money(l.price)}`;
      }).join("\n");
      const note = (state.orderNote || "").trim();
      const text = `Cloud9 Bestellung
${summary}${note ? `

Anmerkungen: ${note}` : ""}

${t.total}: ${money(cartTotal())}`;
      navigator.clipboard?.writeText(text).catch(() => {});
      const ok = document.createElement("button");
      ok.className = "btn primary";
      ok.textContent = "OK";
      ok.onclick = () => { closeModal(); clearCart(); };
      openModal("Bestellung", `<pre style="white-space:pre-wrap;margin:0">${escapeHtml(text)}</pre><div class="small" style="margin-top:10px">${t.copied}</div>`, [ok]);
    };
  }

  function renderCartLines() {
    const host = document.getElementById("cartLines");
    if (!host) return;
    if (!state.cart.length) { host.innerHTML = ""; return; }
    host.innerHTML = state.cart.map((l, idx) => {
      const opt = [];
      if (l.options?.temperature) opt.push(l.options.temperature);
      if (l.options?.size) opt.push(l.options.size);
      return `
        <div class="item">
          <div style="min-width:0">
            <div class="itemTitle">${escapeHtml(l.name)}</div>
            <div class="itemDesc">${escapeHtml(opt.join(" • "))}</div>
          </div>
          <div class="row">
            <div class="price">${money(l.price)}</div>
            <button class="btn danger" data-del="${idx}">✕</button>
          </div>
        </div>
      `;
    }).join("");
    host.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = () => {
        const i = Number(btn.getAttribute("data-del"));
        state.cart.splice(i, 1);
        renderRoute();
      };
    });
  }

  function renderCall() {
    const t = I18N[state.lang];
    return `<div class="card"><div class="h">${t.call}</div><div class="small">${t.callText}</div></div>`;
  }

  function renderPay() {
    const t = I18N[state.lang];
    return `<div class="card"><div class="h">${t.pay}</div><div class="small">${t.payText}</div></div>`;
  }

  function renderQuiz() {
    const t = I18N[state.lang];
    const qz = state.quiz;
    if (!qz) return `<div class="card">Loading…</div>`;
    if (!state.quizStarted) {
      return `<div class="card"><div class="h">${t.quiz}</div><button class="btn primary" id="startQuiz">${t.startQuiz}</button></div>`;
    }
    const idx = state.quizIdx;
    const cur = qz[idx];
    if (!cur) {
      return `<div class="card"><div class="h">${t.quiz}</div><div class="small">Done.</div></div>`;
    }
    const choices = cur.choices.map((c, i) => `<button class="btn" data-ans="${i}" style="text-align:left">${escapeHtml(c)}</button>`).join("");
    return `
      <div class="card">
        <div class="h">${t.quiz} <span class="badge">${idx+1}/${qz.length}</span></div>
        <div style="font-weight:900;margin:12px 0 10px">${escapeHtml(cur.q)}</div>
        <div class="row" style="flex-direction:column;align-items:stretch">${choices}</div>
        <div id="quizFeedback" style="margin-top:12px"></div>
      </div>
    `;
  }

  function bindQuiz() {
    const t = I18N[state.lang];
    const start = document.getElementById("startQuiz");
    if (start) {
      start.onclick = () => {
        state.quizStarted = true;
        state.quizIdx = 0;
        renderRoute();
      };
      return;
    }
    document.querySelectorAll("[data-ans]").forEach(btn => {
      btn.onclick = () => {
        const idx = state.quizIdx;
        const q = state.quiz[idx];
        const picked = Number(btn.getAttribute("data-ans"));
        const ok = picked === q.a;
        const fb = document.getElementById("quizFeedback");
        fb.innerHTML = `
          <div class="chapter">
            <h3>${ok ? t.correct : t.wrong}</h3>
            <p>${escapeHtml(q.ex || "")}</p>
            <button class="btn primary" id="nextBtn">${idx+1 < state.quiz.length ? t.next : t.again}</button>
          </div>
        `;
        document.getElementById("nextBtn").onclick = () => {
          if (idx+1 < state.quiz.length) state.quizIdx += 1;
          else { state.quizStarted = false; state.quizIdx = 0; }
          renderRoute();
        };
      };
    });
  }

  function renderStory() {
    const t = I18N[state.lang];
    const st = state.story;
    if (!st) return `<div class="card">Loading…</div>`;
    const ch = (st.chapters || []).map(c => `
      <div class="chapter">
        <h3>${escapeHtml(c.h)}</h3>
        ${(c.p || []).map(p => `<p>${escapeHtml(p)}</p>`).join("")}
      </div>
    `).join("");
    return `<div class="card"><div class="h">${t.story}</div><div class="small">${escapeHtml(st.title || "")}</div>${ch}</div>`;
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }async function renderNews() {
  const t = I18N[state.lang] || I18N.de;
  const left = el("left");
  left.innerHTML = `
    <div class="panel">
      <div class="panelHeader">
        <h2>${t.news_title || "News"}</h2>
      </div>
      <div id="newsList" class="list"></div>
    </div>
  `;

  const list = el("newsList");
  list.innerHTML = `<div class="small">${t.news_loading || "Loading…"}</div>`;

  try {
    let res;
    try {
      res = await fetch(`/api/news?lang=${encodeURIComponent(state.lang)}&max=6`, { cache: "no-store" });
    } catch (e) {
      res = null;
    }
    if (!res || !res.ok) {
      // Fallback to the project that definitely has the Function deployed
      res = await fetch(`https://cloud9mainz.pages.dev/api/news?lang=${encodeURIComponent(state.lang)}&max=6`, { cache: "no-store" });
    }
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const items = (data.items || []).slice(0, 6);

    if (!items.length) {
            const errs = (data.errors || []).map(e => `${escapeHtml(e.source || e.feedUrl || "")}`).slice(0,3).join(", ");
            list.innerHTML = `<div class="small">${t.news_error || "Could not load news."}${errs ? "<br><span style=\"opacity:.75\">(" + errs + ")</span>" : ""}</div>`;
            return;
          }

    list.innerHTML = items.map(it => `
      <div class="card" style="margin-top:10px">
        <div class="row" style="justify-content:space-between; gap:10px; align-items:flex-start">
          <div>
            <div style="font-weight:700">${escapeHtml(it.title)}</div>
            <div class="small" style="margin-top:6px">${escapeHtml(it.description || "")}</div>
            <div class="small" style="opacity:.8; margin-top:6px">${escapeHtml(it.source || "")}${it.pubDate ? " • " + escapeHtml(new Date(it.pubDate).toLocaleString()) : ""}</div>
          </div>
          <button class="btn" onclick="window.open('${"${escapeHtml(it.link)}"}','_blank','noopener')">${t.news_open || "Open"}</button>
        </div>
      </div>
    `).join("");
  } catch (e) {
    list.innerHTML = `<div class="small">${t.news_error || "Could not load news."}</div><div class="small" style="opacity:.7;margin-top:6px">API: <a href="/api/news?lang=${state.lang}&max=6" target="_blank" rel="noopener">/api/news</a></div>`;
  }
}



  function renderRoute() {
    const route = hashRoute();
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
      view.innerHTML = `<div class="card"><div class="h">News</div><div class="small">Lade...</div></div>`;
      renderNews().then((html) => {
        view.innerHTML = html;
        bindNews();
      }).catch((err) => {
        console.error(err);
        view.innerHTML = `<div class="card"><div class="h">News</div><div class="small">News konnten nicht geladen werden.</div></div>`;
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
