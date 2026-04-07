// ============================================================
//  DIGITAL STRINGS — APP LOGIC v9
//  - Tipos de evento: matrimonio, xv-años, bautizo, privado, empresarial
//  - Tab Ceremonia: visible/oculto según tipo de evento
//  - Bautizo: siempre en capilla (no se cobra sonido ceremonia)
//  - XV Años: sin tab Ceremonia
//  - Footer fijo al fondo en impresión
// ============================================================

// ── CONFIGURACIÓN POR TIPO DE EVENTO ──────────────────────
const EVENT_CONFIG = {
  "matrimonio": {
    label: "COTIZACIÓN MATRIMONIO",
    hasCeremonia: true,
    ceremonyOptions: ["simbolica","cristiana","catolica"],
    defaultCeremony: "simbolica"
  },
  "xv-anos": {
    label: "COTIZACIÓN XV AÑOS",
    hasCeremonia: false,
    ceremonyOptions: [],
    defaultCeremony: ""
  },
  "bautizo": {
    label: "COTIZACIÓN BAUTIZO",
    hasCeremonia: true,
    ceremonyOptions: ["catolica"],
    defaultCeremony: "catolica"   // bautizo siempre en capilla
  },
  "privado": {
    label: "COTIZACIÓN EVENTO PRIVADO",
    hasCeremonia: true,
    ceremonyOptions: ["simbolica","cristiana","catolica"],
    defaultCeremony: "simbolica"
  },
  "empresarial": {
    label: "COTIZACIÓN EVENTO EMPRESARIAL",
    hasCeremonia: true,
    ceremonyOptions: ["simbolica","cristiana","catolica"],
    defaultCeremony: "simbolica"
  }
};

const EVENT_TYPE_LABELS = {
  "matrimonio":  "💍 MATRIMONIO",
  "xv-anos":     "🌹 XV AÑOS",
  "bautizo":     "✝️ BAUTIZO",
  "privado":     "🎉 EVENTO PRIVADO",
  "empresarial": "🏢 EVENTO EMPRESARIAL"
};

// ── STATE ──────────────────────────────────────────────────
const state = {
  event: {
    type: "matrimonio",
    couple: "",
    city: "",
    date: "",
    start: "",
    end: "",
    ceremonyType: "simbolica"
  },
  cart: {},
  polvoraQty: { catalogo: 2, basico: 2, elite: 4, premium: 6 },
  plans: { basico: new Set(), elite: new Set(), premium: new Set() },
  discounts: { basico: 0, elite: 0, premium: 0 },
  discountManual: { basico: false, elite: false, premium: false },
  activeMoment: "ceremonia",
  drag: { id: null, sourcePlan: null }
};

const POLVORA_ID = "il-polvora";
const POLVORA_UNIT_PRICE      = 150000;
const POLVORA_UNIT_PRICE_BULK = 125000;

// ── UTILS ──────────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return "Consultar";
  return "$" + n.toLocaleString("es-CO").replace(/,/g, ".");
}

function getItemDef(id) {
  for (const [moment, items] of Object.entries(DB)) {
    const found = items.find(i => i.id === id);
    if (found) return { ...found, momentOrigen: moment };
  }
  return null;
}

function getEffectiveMoment(id) {
  return state.cart[id]?.moment || getItemDef(id)?.momentOrigen || "ceremonia";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = parseInt(h);
  const ampm = hh >= 12 ? "pm" : "am";
  const disp = hh > 12 ? hh - 12 : (hh === 0 ? 12 : hh);
  return `${disp}:${m}${ampm}`;
}

// ── PRECIO PÓLVORA (ESCALONADO) ────────────────────────────
function getPolvoraPrice(planKey) {
  const qty = state.polvoraQty[planKey] || 2;
  if (qty <= 2) return POLVORA_UNIT_PRICE * qty;
  return qty * POLVORA_UNIT_PRICE_BULK;
}

function getItemPrice(id, planKey) {
  if (id === POLVORA_ID) return getPolvoraPrice(planKey || "catalogo");
  const def = getItemDef(id);
  return def?.precio || 0;
}

// ── AUTO-DISCOUNT LOGIC ────────────────────────────────────
const VALID_MOMENTS = ["ceremonia","coctel","protocolo","cena","fiesta","iluminacion"];

function calcAutoDiscount(planKey) {
  let sub = 0;
  const coveredMoments = new Set();

  state.plans[planKey].forEach(id => {
    sub += getItemPrice(id, planKey);
    const m = getEffectiveMoment(id);
    if (VALID_MOMENTS.includes(m)) coveredMoments.add(m);
  });

  const cat = coveredMoments.size;

  if (sub >= 25000000)             return { pct: 18, reason: "Subtotal ≥ $25M" };
  if (sub >= 15000000)             return { pct: 15, reason: "Subtotal ≥ $15M" };
  if (sub >= 11000000 || cat >= 6) return { pct: 10, reason: cat >= 6 ? "1 ítem en cada categoría" : "Subtotal ≥ $11M" };
  if (sub >= 7000000  || cat >= 5) return { pct:  5, reason: cat >= 5 ? "5 categorías cubiertas" : "Subtotal ≥ $7M" };
  if (sub >= 6000000  || cat >= 4) return { pct:  3, reason: cat >= 4 ? "4 categorías cubiertas" : "Subtotal ≥ $6M" };

  return { pct: 0, reason: "Sin descuento aún" };
}

// ── PLAN TOTALS ────────────────────────────────────────────
function planSubtotal(planKey) {
  let sum = 0;
  state.plans[planKey].forEach(id => { sum += getItemPrice(id, planKey); });
  return sum;
}

// ── ACTUALIZAR TAB Y SECCIÓN CEREMONIA según tipo de evento ──
function updateEventTypeUI() {
  const cfg = EVENT_CONFIG[state.event.type] || EVENT_CONFIG["matrimonio"];
  const tabCeremonia = document.querySelector('.tab-btn[data-moment="ceremonia"]');
  const sectionCeremonia = document.getElementById("section-ceremonia");
  const ceremonyBlock = document.getElementById("ceremony-config-block");

  // Mostrar/ocultar tab Ceremonia
  if (tabCeremonia) {
    tabCeremonia.style.display = cfg.hasCeremonia ? "" : "none";
  }

  // Mostrar/ocultar bloque de configuración de ceremonia en el modal
  if (ceremonyBlock) {
    ceremonyBlock.style.display = cfg.hasCeremonia ? "" : "none";
  }

  // Si el evento no tiene ceremonia y el tab activo es ceremonia, cambiar al primer tab visible
  if (!cfg.hasCeremonia && state.activeMoment === "ceremonia") {
    const firstVisible = MOMENT_ORDER.find(m => m !== "ceremonia");
    if (firstVisible) switchTab(firstVisible);
  }

  // Actualizar opciones del select de ceremonia en el modal
  const cfgCeremony = document.getElementById("cfg-ceremony");
  if (cfgCeremony) {
    cfgCeremony.innerHTML = cfg.ceremonyOptions.map(opt => {
      const labels = { simbolica: "Simbólica", cristiana: "Cristiana", catolica: "Católica (capilla)" };
      return `<option value="${opt}" ${state.event.ceremonyType === opt ? "selected" : ""}>${labels[opt]}</option>`;
    }).join("");
  }

  // Actualizar label del header
  const labelEl = document.getElementById("display-event-type");
  if (labelEl) labelEl.textContent = EVENT_TYPE_LABELS[state.event.type] || "COTIZACIÓN";
}

function switchTab(moment) {
  state.activeMoment = moment;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`.tab-btn[data-moment="${moment}"]`);
  if (btn) btn.classList.add("active");
  document.querySelectorAll(".moment-section").forEach(s => s.classList.remove("active"));
  const sec = document.getElementById(`section-${moment}`);
  if (sec) sec.classList.add("active");
}

// ── RENDER GRIDS ────────────────────────────────────────────
function renderGrid(moment) {
  const items = DB[moment];
  const grid = document.getElementById(`grid-${moment}`);
  if (!grid || !items) return;
  grid.innerHTML = "";

  const isCatolica = state.event.ceremonyType === "catolica";
  const isBautizo  = state.event.type === "bautizo";

  items.forEach(item => {
    // En capilla católica o bautizo no se ofrece sonido de ceremonia
    if (item.id === "c-sonido" && (isCatolica || isBautizo)) return;

    const inCart = !!state.cart[item.id];
    const card = document.createElement("div");
    card.className = `item-card${inCart ? " in-cart" : ""}`;

    const displayPrice = item.id === POLVORA_ID
      ? fmt(getPolvoraPrice("catalogo"))
      : fmt(item.precio);

    const priceDisplay = item.siempre
      ? '<span class="item-price">Incluido</span>'
      : `<span class="item-price" id="cat-price-${item.id}">${displayPrice}</span>`;

    const durDisplay = item.duracion
      ? item.duracion
      : item.horas ? `${item.horas} hora${item.horas > 1 ? "s" : ""}` : "";

    const btnText = item.siempre ? "Siempre incluido" : inCart ? "✓ En carrito" : "+ Agregar";
    const btnClass = item.siempre ? "btn-add disabled-btn" : inCart ? "btn-add in-cart-btn" : "btn-add";

    let polvoraExtra = "";
    if (item.id === POLVORA_ID) {
      polvoraExtra = `
        <div class="polvora-qty-row">
          <span class="polvora-qty-label">Vista previa disparos:</span>
          <div class="polvora-qty-ctrl">
            <button class="polvora-btn" onclick="changeCatalogoQty(-1)">−</button>
            <span class="polvora-qty-val" id="cat-polvora-qty">${state.polvoraQty.catalogo}</span>
            <button class="polvora-btn" onclick="changeCatalogoQty(1)">+</button>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="item-nombre">${item.nombre}</div>
      <div class="item-desc">${item.descripcion}</div>
      ${durDisplay ? `<div class="item-duracion">⏱ ${durDisplay}</div>` : ""}
      ${polvoraExtra}
      <div class="item-footer">
        ${priceDisplay}
        <button class="${btnClass}" ${item.siempre ? "disabled" : ""} onclick="toggleCart('${item.id}','${moment}')">${btnText}</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderAllGrids() {
  MOMENT_ORDER.forEach(m => renderGrid(m));
}

function changeCatalogoQty(delta) {
  state.polvoraQty.catalogo = Math.max(2, state.polvoraQty.catalogo + delta * 2);
  const qEl = document.getElementById("cat-polvora-qty");
  if (qEl) qEl.textContent = state.polvoraQty.catalogo;
  const pEl = document.getElementById(`cat-price-${POLVORA_ID}`);
  if (pEl) pEl.textContent = fmt(getPolvoraPrice("catalogo"));
}

// ── CART TOGGLE ─────────────────────────────────────────────
function toggleCart(id, originMoment) {
  if (state.cart[id]) {
    delete state.cart[id];
    ["basico","elite","premium"].forEach(p => state.plans[p].delete(id));
  } else {
    state.cart[id] = { moment: originMoment };
  }
  renderAllGrids();
  renderCart();
  renderPlanBuilder();
}

// ── RENDER CART ─────────────────────────────────────────────
function renderCart() {
  const container = document.getElementById("cart-items");
  const ids = Object.keys(state.cart);

  if (ids.length === 0) {
    container.innerHTML = '<div class="cart-empty">Agrega servicios al carrito</div>';
    return;
  }

  const groups = {};
  ids.forEach(id => {
    const m = getEffectiveMoment(id);
    if (!groups[m]) groups[m] = [];
    groups[m].push(id);
  });

  container.innerHTML = "";

  MOMENT_ORDER.forEach(moment => {
    const gids = groups[moment];
    if (!gids || gids.length === 0) return;

    const groupEl = document.createElement("div");
    groupEl.className = "cart-group";
    groupEl.innerHTML = `<div class="cart-group-label">${MOMENT_ICONS[moment]} ${MOMENT_LABELS[moment]}</div>`;

    gids.forEach(id => {
      const def = getItemDef(id);
      if (!def) return;

      const div = document.createElement("div");
      div.className = "cart-item";
      div.draggable = true;
      div.dataset.id = id;

      const momentOptions = MOMENT_ORDER.map(m =>
        `<option value="${m}" ${getEffectiveMoment(id) === m ? "selected" : ""}>${MOMENT_LABELS[m]}</option>`
      ).join("");

      div.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-name">${def.nombre}</div>
          <div class="cart-item-moment-change">
            <span class="moment-change-label">Mover a:</span>
            <select class="moment-select" onchange="changeItemMoment('${id}', this.value)">
              ${momentOptions}
            </select>
          </div>
        </div>
        <button class="btn-remove-item" onclick="toggleCart('${id}')" title="Quitar">✕</button>
      `;

      div.addEventListener("dragstart", e => {
        state.drag.id = id;
        state.drag.sourcePlan = null;
        e.dataTransfer.effectAllowed = "copy";
        div.classList.add("dragging");
      });
      div.addEventListener("dragend", () => div.classList.remove("dragging"));
      groupEl.appendChild(div);
    });

    container.appendChild(groupEl);
  });
}

function changeItemMoment(id, newMoment) {
  if (!state.cart[id]) return;
  state.cart[id].moment = newMoment;
  renderCart();
  renderPlanBuilder();
}

// ── PLAN BUILDER ────────────────────────────────────────────
const PLAN_KEYS = ["basico","elite","premium"];
const PLAN_LABELS = { basico: "BÁSICO", elite: "ELITE", premium: "PREMIUM" };

function renderPlanBuilder() {
  const container = document.getElementById("plan-builder");
  if (!container) return;
  container.innerHTML = "";

  PLAN_KEYS.forEach(planKey => {
    const col = document.createElement("div");
    col.className = `plan-col plan-col-${planKey}`;
    col.dataset.plan = planKey;

    const autoD = calcAutoDiscount(planKey);
    if (!state.discountManual[planKey]) {
      state.discounts[planKey] = autoD.pct;
    }

    const sub = planSubtotal(planKey);
    const dcto = state.discounts[planKey] || 0;
    const totalConDcto = Math.round(sub * (1 - dcto / 100));

    let hintText = "";
    if (sub > 0) {
      if (state.discountManual[planKey]) {
        hintText = `Sugerido: ${autoD.pct}% · ${autoD.reason}`;
      } else if (autoD.pct > 0) {
        hintText = `✓ Dcto. auto ${autoD.pct}% · ${autoD.reason}`;
      } else {
        hintText = `Sin dcto. aún · ${autoD.reason}`;
      }
    }

    const preciosHTML = sub > 0 ? `
      <div class="plan-precio-subtotal">
        <span class="plan-precio-label">Subtotal</span>
        <span class="plan-precio-val" id="subtotal-${planKey}">${fmt(sub)}</span>
      </div>
      ${dcto > 0 ? `
      <div class="plan-precio-total">
        <span class="plan-precio-label">Total c/ ${dcto}% dcto.</span>
        <span class="plan-precio-val plan-precio-total-val" id="total-${planKey}">${fmt(totalConDcto)}</span>
      </div>` : `
      <div class="plan-precio-total" id="total-wrap-${planKey}" style="display:none">
        <span class="plan-precio-label"></span>
        <span class="plan-precio-val plan-precio-total-val" id="total-${planKey}"></span>
      </div>`}
    ` : "";

    col.innerHTML = `
      <div class="plan-col-head plan-head-${planKey}">
        <div class="plan-col-title">${PLAN_LABELS[planKey]}</div>
        ${preciosHTML}
        <div class="plan-discount-row">
          <span class="plan-dcto-label">Dcto:</span>
          <div class="plan-dcto-wrap">
            <input
              type="number" class="plan-dcto-input"
              value="${dcto}" min="0" max="100" step="0.5"
              data-plan="${planKey}"
              onchange="setPlanDiscount('${planKey}', this.value)"
              oninput="setPlanDiscount('${planKey}', this.value)"
            />
            <span class="plan-dcto-pct">%</span>
          </div>
        </div>
        ${sub > 0 ? `<div class="plan-auto-hint" title="${autoD.reason}">${hintText}</div>` : ""}
      </div>
      <div class="plan-drop-zone" data-plan="${planKey}" id="drop-${planKey}">
        ${state.plans[planKey].size === 0
          ? '<div class="plan-drop-hint">Arrastra ítems del carrito aquí</div>'
          : ""}
      </div>
    `;

    const dropZone = col.querySelector(".plan-drop-zone");
    state.plans[planKey].forEach(id => {
      const def = getItemDef(id);
      if (!def) return;
      const effectiveMoment = getEffectiveMoment(id);
      const price = getItemPrice(id, planKey);
      const pill = document.createElement("div");
      pill.className = "plan-item-pill";
      pill.draggable = true;
      pill.dataset.id = id;
      pill.dataset.plan = planKey;

      const polvoraCtrl = id === POLVORA_ID ? `
        <div class="pill-polvora-ctrl">
          <button class="polvora-btn polvora-btn-sm" onclick="changePlanPolvoraQty('${planKey}',-1);event.stopPropagation()">−</button>
          <span class="pill-polvora-qty" id="polvora-qty-${planKey}">${state.polvoraQty[planKey]}</span>
          <button class="polvora-btn polvora-btn-sm" onclick="changePlanPolvoraQty('${planKey}',1);event.stopPropagation()">+</button>
          <span class="pill-polvora-label">disp.</span>
        </div>
      ` : "";

      const priceDisplay = id === POLVORA_ID
        ? `<span class="pill-price" id="polvora-price-${planKey}">${fmt(price)}</span>`
        : `<span class="pill-price">${price ? fmt(price) : "—"}</span>`;

      pill.innerHTML = `
        <div class="pill-left">
          <span class="pill-moment-icon">${MOMENT_ICONS[effectiveMoment] || "🎵"}</span>
          <div class="pill-info">
            <div class="pill-name">${def.nombre}</div>
            ${polvoraCtrl}
            ${priceDisplay}
          </div>
        </div>
        <button class="pill-remove" onclick="removeFromPlan('${planKey}','${id}')" title="Quitar del plan">✕</button>
      `;

      pill.addEventListener("dragstart", e => {
        state.drag.id = id;
        state.drag.sourcePlan = planKey;
        e.dataTransfer.effectAllowed = "move";
        pill.classList.add("dragging");
      });
      pill.addEventListener("dragend", () => pill.classList.remove("dragging"));
      dropZone.appendChild(pill);
    });

    col.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = state.drag.sourcePlan ? "move" : "copy";
      col.classList.add("drag-over");
    });
    col.addEventListener("dragleave", e => {
      if (!col.contains(e.relatedTarget)) col.classList.remove("drag-over");
    });
    col.addEventListener("drop", e => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = state.drag.id;
      const sourcePlan = state.drag.sourcePlan;
      if (!id || !state.cart[id]) return;
      if (sourcePlan && sourcePlan !== planKey) state.plans[sourcePlan].delete(id);
      state.plans[planKey].add(id);
      state.drag.id = null;
      state.drag.sourcePlan = null;
      renderPlanBuilder();
    });

    container.appendChild(col);
  });
}

// ── RECALCULAR HEADER PLAN ──────────────────────────────────
function recalcPlanHeader(planKey) {
  const autoD = calcAutoDiscount(planKey);
  if (!state.discountManual[planKey]) {
    state.discounts[planKey] = autoD.pct;
    const inputEl = document.querySelector(`.plan-col-${planKey} .plan-dcto-input`);
    if (inputEl) inputEl.value = autoD.pct;
  }

  const sub = planSubtotal(planKey);
  const dcto = state.discounts[planKey] || 0;
  const totalConDcto = Math.round(sub * (1 - dcto / 100));

  const subEl = document.getElementById(`subtotal-${planKey}`);
  if (subEl) subEl.textContent = fmt(sub);

  const totalEl = document.getElementById(`total-${planKey}`);
  const totalWrap = document.getElementById(`total-wrap-${planKey}`);
  if (totalEl) {
    if (dcto > 0) {
      totalEl.textContent = fmt(totalConDcto);
      const labelEl = totalEl.previousElementSibling;
      if (labelEl) labelEl.textContent = `Total c/ ${dcto}% dcto.`;
      if (totalWrap) totalWrap.style.display = "";
    } else {
      if (totalWrap) totalWrap.style.display = "none";
    }
  }

  const hintEl = document.querySelector(`.plan-col-${planKey} .plan-auto-hint`);
  if (hintEl) {
    if (state.discountManual[planKey]) {
      hintEl.textContent = `Sugerido: ${autoD.pct}% · ${autoD.reason}`;
    } else if (autoD.pct > 0) {
      hintEl.textContent = `✓ Dcto. auto ${autoD.pct}% · ${autoD.reason}`;
    } else {
      hintEl.textContent = `Sin dcto. aún · ${autoD.reason}`;
    }
  }
}

// ── PÓLVORA POR PLAN ────────────────────────────────────────
function changePlanPolvoraQty(planKey, delta) {
  state.polvoraQty[planKey] = Math.max(2, (state.polvoraQty[planKey] || 2) + delta * 2);
  const qEl = document.getElementById(`polvora-qty-${planKey}`);
  if (qEl) qEl.textContent = state.polvoraQty[planKey];
  const pEl = document.getElementById(`polvora-price-${planKey}`);
  if (pEl) pEl.textContent = fmt(getPolvoraPrice(planKey));
  recalcPlanHeader(planKey);
}

// ── DESCUENTO MANUAL ────────────────────────────────────────
function setPlanDiscount(planKey, value) {
  state.discounts[planKey] = parseFloat(value) || 0;
  state.discountManual[planKey] = true;

  const sub = planSubtotal(planKey);
  const dcto = state.discounts[planKey];
  const totalConDcto = Math.round(sub * (1 - dcto / 100));
  const autoD = calcAutoDiscount(planKey);

  const totalEl = document.getElementById(`total-${planKey}`);
  const totalWrap = document.getElementById(`total-wrap-${planKey}`);
  if (totalEl) {
    if (dcto > 0) {
      totalEl.textContent = fmt(totalConDcto);
      const labelEl = totalEl.previousElementSibling;
      if (labelEl) labelEl.textContent = `Total c/ ${dcto}% dcto.`;
      if (totalWrap) totalWrap.style.display = "";
    } else {
      if (totalWrap) totalWrap.style.display = "none";
    }
  }

  const hintEl = document.querySelector(`.plan-col-${planKey} .plan-auto-hint`);
  if (hintEl) hintEl.textContent = `Sugerido: ${autoD.pct}% · ${autoD.reason}`;
}

function removeFromPlan(planKey, id) {
  state.plans[planKey].delete(id);
  renderPlanBuilder();
}

// ── TABS ────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      switchTab(btn.dataset.moment);
    });
  });
}

// ── CEREMONY UI ─────────────────────────────────────────────
function updateCeremonyUI() {
  const badge = document.getElementById("ceremony-badge");
  const note  = document.getElementById("sound-note");
  const isCatolica = state.event.ceremonyType === "catolica";
  const isBautizo  = state.event.type === "bautizo";
  const cfg = EVENT_CONFIG[state.event.type] || EVENT_CONFIG["matrimonio"];

  // Badge
  if (badge) {
    if (!cfg.hasCeremonia) {
      badge.textContent = "";
    } else {
      const labels = { simbolica: "Simbólica", cristiana: "Cristiana", catolica: "Católica (Capilla)" };
      badge.textContent = labels[state.event.ceremonyType] || "";
    }
  }

  // Nota de sonido
  if (note) {
    const showNote = isCatolica || isBautizo;
    note.style.display = showNote ? "block" : "none";
    if (showNote) note.textContent = "En capilla católica el sonido de ceremonia no se cobra.";
  }

  // Quitar sonido del carrito si aplica
  if ((isCatolica || isBautizo) && state.cart["c-sonido"]) {
    delete state.cart["c-sonido"];
    ["basico","elite","premium"].forEach(p => state.plans[p].delete("c-sonido"));
  }
}

// ── CONFIG MODAL ─────────────────────────────────────────────
function setupConfig() {
  document.getElementById("btn-open-config").addEventListener("click", () => {
    // Sincronizar valores actuales al abrir
    document.getElementById("cfg-event-type").value = state.event.type;
    document.getElementById("cfg-couple").value = state.event.couple;
    document.getElementById("cfg-city").value = state.event.city;
    document.getElementById("cfg-date").value = state.event.date;
    document.getElementById("cfg-start").value = state.event.start;
    document.getElementById("cfg-end").value = state.event.end;
    updateCeremonyConfigBlock();
    document.getElementById("modal-config").classList.add("open");
  });

  // Cuando cambia tipo de evento en el modal, actualizar opciones de ceremonia
  document.getElementById("cfg-event-type").addEventListener("change", () => {
    updateCeremonyConfigBlock();
  });

  document.getElementById("btn-close-config").addEventListener("click", () => {
    document.getElementById("modal-config").classList.remove("open");
  });

  document.getElementById("btn-save-config").addEventListener("click", () => {
    state.event.type = document.getElementById("cfg-event-type").value;
    state.event.couple = document.getElementById("cfg-couple").value;
    state.event.city = document.getElementById("cfg-city").value;
    state.event.date = document.getElementById("cfg-date").value;
    state.event.start = document.getElementById("cfg-start").value;
    state.event.end = document.getElementById("cfg-end").value;

    const cfg = EVENT_CONFIG[state.event.type] || EVENT_CONFIG["matrimonio"];
    if (cfg.hasCeremonia) {
      state.event.ceremonyType = document.getElementById("cfg-ceremony").value;
    } else {
      state.event.ceremonyType = "";
    }

    document.getElementById("modal-config").classList.remove("open");
    updateHeaderDisplay();
    updateEventTypeUI();
    updateCeremonyUI();
    renderAllGrids();
    renderCart();
    renderPlanBuilder();
  });
}

// Actualiza el bloque de ceremonia en el modal según tipo de evento seleccionado
function updateCeremonyConfigBlock() {
  const selectedType = document.getElementById("cfg-event-type").value;
  const cfg = EVENT_CONFIG[selectedType] || EVENT_CONFIG["matrimonio"];
  const block = document.getElementById("ceremony-config-block");
  const select = document.getElementById("cfg-ceremony");

  block.style.display = cfg.hasCeremonia ? "" : "none";

  if (cfg.hasCeremonia) {
    const labels = { simbolica: "Simbólica", cristiana: "Cristiana", catolica: "Católica (capilla)" };
    select.innerHTML = cfg.ceremonyOptions.map(opt =>
      `<option value="${opt}" ${state.event.ceremonyType === opt ? "selected" : ""}>${labels[opt]}</option>`
    ).join("");

    // Si solo hay una opción (bautizo), seleccionarla automáticamente
    if (cfg.ceremonyOptions.length === 1) {
      select.value = cfg.ceremonyOptions[0];
    }
  }
}

function updateHeaderDisplay() {
  const ev = state.event;
  const coupleEl = document.getElementById("display-couple");
  const metaEl   = document.getElementById("display-meta");
  if (coupleEl) coupleEl.textContent = ev.couple || "Cliente";
  if (metaEl) {
    const parts = [ev.city, formatDate(ev.date), ev.start && ev.end ? `${formatTime(ev.start)}–${formatTime(ev.end)}` : ""].filter(Boolean);
    metaEl.textContent = parts.join(" · ");
  }
}

// ── SHARED FOOTER HTML ──────────────────────────────────────
function sharedFooterHTML() {
  return `
    <div class="quote-footer-shared">
      <div class="qfs-left">
        <div class="qfs-company"><strong>DIGITAL STRINGS SAS</strong> &nbsp;·&nbsp; NIT 901645682 &nbsp;·&nbsp; Cr 58 # 125b - 29 &nbsp;·&nbsp; Bogotá · Colombia</div>
        <div class="qfs-people"><strong>JOSE LUIS DIAZ</strong> Director Musical &nbsp;·&nbsp; <strong>DANIEL BUITRAGO</strong> Productor Musical</div>
      </div>
      <div class="qfs-tagline">YOUR TIME<br>YOUR PLEASURE</div>
    </div>
    <div class="qfs-contacts">
      <span>📸 digitalstringsmusic</span>
      <span>📞 +57 3114513734</span>
      <span>📞 +57 3143568232</span>
      <span>✉ digitalstringsmusic@gmail.com</span>
    </div>
  `;
}

// ── GENERATE QUOTE ──────────────────────────────────────────
function generateQuote() {
  const hasItems = PLAN_KEYS.some(p => state.plans[p].size > 0);
  if (!hasItems) {
    alert("Arrastra al menos un ítem a los planes antes de generar la cotización.");
    return;
  }

  const ev = state.event;
  const cfg = EVENT_CONFIG[ev.type] || EVENT_CONFIG["matrimonio"];

  let html = `<div class="quote-page quote-page-1">`;
  html += `<div class="quote-page-body">`;

  html += `
    <div class="quote-doc-header">
      <div class="qdh-left">
        <div class="qdh-label">${cfg.label}</div>
        <div class="q-couple">${ev.couple || "—"}</div>
        <div class="q-meta">
          ${ev.city ? `Lugar: ${ev.city}` : ""}
          ${ev.date ? `&nbsp;·&nbsp; Fecha: ${formatDate(ev.date)}` : ""}
          ${ev.start && ev.end ? `&nbsp;·&nbsp; Hora: ${formatTime(ev.start)} – ${formatTime(ev.end)}` : ""}
        </div>
      </div>
      <div class="qdh-right">
        <div class="quote-logo-circle">
          <img src="logo.png" alt="Digital Strings" />
        </div>
      </div>
    </div>
    <div class="quote-divider"></div>
    <div class="quote-plans-label">PROPUESTA DE PLANES</div>
    <div class="quote-plans">
  `;

  PLAN_KEYS.forEach(key => {
    const ids = [...state.plans[key]];
    if (ids.length === 0) return;

    let subtotal = 0;
    const byMoment = {};

    ids.forEach(id => {
      const def = getItemDef(id);
      if (!def) return;
      const price = getItemPrice(id, key);
      subtotal += price;
      const m = getEffectiveMoment(id);
      if (!byMoment[m]) byMoment[m] = [];
      byMoment[m].push({ def, price, id });
    });

    const dcto = state.discounts[key] || 0;
    const total = Math.round(subtotal * (1 - dcto / 100));

    html += `<div class="plan-card plan-${key}">
      <div class="plan-head"><h4>${PLAN_LABELS[key]}</h4></div>
      <div class="plan-body">`;

    MOMENT_ORDER.forEach(moment => {
      const mItems = byMoment[moment];
      if (!mItems || mItems.length === 0) return;
      html += `<div class="plan-moment-group">
        <div class="plan-moment-label">${MOMENT_ICONS[moment]} ${MOMENT_LABELS[moment].toUpperCase()}</div>`;
      mItems.forEach(({ def, price, id }) => {
        const hrs = def.horas ? `${def.horas}h` : (def.duracion || "");
        const qty = state.polvoraQty[key] || 2;
        const nameDisplay = id === POLVORA_ID ? `${def.nombre} x${qty}` : def.nombre;
        html += `<div class="plan-item-row">
          <span class="pi-name">${nameDisplay}</span>
          <span class="pi-hrs">${hrs}</span>
          <span class="pi-price">${price ? fmt(price) : "—"}</span>
        </div>`;
      });
      html += `</div>`;
    });

    html += `</div>
      <div class="plan-footer">
        <div class="plan-subtotal-row">Subtotal <strong>${fmt(subtotal)}</strong></div>
        ${dcto > 0 ? `<div class="plan-dcto-line">DCTO. ${dcto}%</div>` : ""}
        <div class="plan-total-box">
          <div class="plan-total-label">TOTAL</div>
          <div class="plan-total-val">${fmt(total)}</div>
        </div>
      </div>
    </div>`;
  });

  html += `</div>`; // end quote-plans
  html += `</div>`; // end quote-page-body

  // Footer fijo al fondo de la página 1
  html += `<div class="quote-page-footer">${sharedFooterHTML()}</div>`;
  html += `</div>`; // end page 1

  // ── PÁGINA 2 ────────────────────────────────────────────
  html += `<div class="quote-page quote-page-2">`;
  html += `<div class="quote-page-body">`;
  html += `
    <div class="considerations-block">
      <h3 class="considerations-title">CONSIDERACIONES</h3>
      <div class="considerations-divider"></div>
      <ul class="considerations-list">
        <li><strong>Abono del 10%:</strong> Para reservar la fecha y mantener el valor acordado, se solicita un abono correspondiente al 10% del total.</li>
        <li><strong>Hora de Preproducción:</strong> Se requieren 8 horas de preproducción antes del inicio del evento para realizar el montaje técnico correspondiente y garantizar el correcto funcionamiento de todos los equipos.</li>
        <li><strong>Electricidad:</strong> La electricidad es responsabilidad del venue o del contratante, quien deberá garantizar tomas de corriente normalizadas a 110 V, en adecuadas condiciones de estabilidad y seguridad para la operación de los equipos.</li>
        <li><strong>Formas de Pago:</strong> Si el pago se hace con datáfono o link de pago se suma el cobro adicional de las comisiones interbancarias según simulación de la pasarela de pago.</li>
        <li><strong>Alimentación del equipo:</strong> En caso de que el evento se desarrolle durante la noche o afecte el horario habitual de comida, se deberá proporcionar cena para el equipo de Digital Strings, garantizando condiciones adecuadas de alimentación para el correcto desempeño de sus funciones.</li>
      </ul>
    </div>
    <div class="p2-footer-center">
      <img src="QR.png" alt="QR" class="qr-img">
    </div>
  `;
  html += `</div>`; // end quote-page-body

  // Footer fijo al fondo de la página 2
  html += `<div class="quote-page-footer">${sharedFooterHTML()}</div>`;
  html += `</div>`; // end page 2

  document.getElementById("quote-content").innerHTML = html;
  document.getElementById("quote-output").style.display = "block";
  window.scrollTo(0, 0);
}

// ── CLEAR ────────────────────────────────────────────────────
document.getElementById("btn-clear-cart").addEventListener("click", () => {
  if (confirm("¿Limpiar todo el carrito y los planes?")) {
    state.cart = {};
    state.plans = { basico: new Set(), elite: new Set(), premium: new Set() };
    state.discounts = { basico: 0, elite: 0, premium: 0 };
    state.discountManual = { basico: false, elite: false, premium: false };
    renderCart();
    renderAllGrids();
    renderPlanBuilder();
  }
});

document.getElementById("btn-clear-plans")?.addEventListener("click", () => {
  if (confirm("¿Limpiar los 3 planes?")) {
    state.plans = { basico: new Set(), elite: new Set(), premium: new Set() };
    state.discounts = { basico: 0, elite: 0, premium: 0 };
    state.discountManual = { basico: false, elite: false, premium: false };
    renderPlanBuilder();
  }
});

// ── PRINT / CLOSE ────────────────────────────────────────────
document.getElementById("btn-print").addEventListener("click", () => window.print());
document.getElementById("btn-close-quote").addEventListener("click", () => {
  document.getElementById("quote-output").style.display = "none";
});
document.getElementById("btn-generate").addEventListener("click", generateQuote);

// ── INIT ─────────────────────────────────────────────────────
function init() {
  setupTabs();
  setupConfig();
  renderAllGrids();
  updateEventTypeUI();
  updateCeremonyUI();
  updateHeaderDisplay();
  renderPlanBuilder();
}

document.addEventListener("DOMContentLoaded", init);