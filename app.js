// ============================================================
//  DIGITAL STRINGS — APP LOGIC v3
//  - Descuento independiente por plan
//  - Quote imprime en 2 páginas: planes / consideraciones
// ============================================================

// ── STATE ──────────────────────────────────────────────────
const state = {
  event: {
    couple: "",
    city: "",
    date: "",
    start: "",
    end: "",
    ceremonyType: ""
  },
  cart: {},
  plans: { basico: new Set(), elite: new Set(), premium: new Set() },
  discounts: { basico: 8, elite: 8, premium: 8 },
  activeMoment: "ceremonia",
  drag: { id: null, sourcePlan: null }
};

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

function planSubtotal(planKey) {
  let sum = 0;
  state.plans[planKey].forEach(id => {
    const def = getItemDef(id);
    if (def && def.precio) sum += def.precio;
  });
  return sum;
}

function planFinalTotal(planKey) {
  const sub = planSubtotal(planKey);
  const dcto = state.discounts[planKey] || 0;
  return Math.round(sub * (1 - dcto / 100));
}

// ── RENDER GRIDS ────────────────────────────────────────────
function renderGrid(moment) {
  const items = DB[moment];
  const grid = document.getElementById(`grid-${moment}`);
  if (!grid || !items) return;
  grid.innerHTML = "";

  items.forEach(item => {
    if (item.id === "c-sonido" && state.event.ceremonyType === "catolica") return;

    const inCart = !!state.cart[item.id];
    const card = document.createElement("div");
    card.className = `item-card${inCart ? " in-cart" : ""}`;

    const priceDisplay = item.siempre
      ? '<span class="item-price">Incluido</span>'
      : `<span class="item-price">${fmt(item.precio)}</span>`;

    const durDisplay = item.duracion
      ? item.duracion
      : item.horas ? `${item.horas} hora${item.horas > 1 ? "s" : ""}` : "";

    const btnText = item.siempre ? "Siempre incluido" : inCart ? "✓ En carrito" : "+ Agregar";
    const btnClass = item.siempre ? "btn-add disabled-btn" : inCart ? "btn-add in-cart-btn" : "btn-add";

    card.innerHTML = `
      <div class="item-nombre">${item.nombre}</div>
      <div class="item-desc">${item.descripcion}</div>
      ${durDisplay ? `<div class="item-duracion">⏱ ${durDisplay}</div>` : ""}
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

// ── RENDER CART PANEL ───────────────────────────────────────
function renderCart() {
  const container = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("cart-subtotal-val");
  const ids = Object.keys(state.cart);

  if (ids.length === 0) {
    container.innerHTML = '<div class="cart-empty">Agrega servicios al carrito</div>';
    subtotalEl.textContent = "$0";
    return;
  }

  const groups = {};
  ids.forEach(id => {
    const m = getEffectiveMoment(id);
    if (!groups[m]) groups[m] = [];
    groups[m].push(id);
  });

  container.innerHTML = "";
  let total = 0;

  MOMENT_ORDER.forEach(moment => {
    const gids = groups[moment];
    if (!gids || gids.length === 0) return;

    const groupEl = document.createElement("div");
    groupEl.className = "cart-group";
    groupEl.innerHTML = `<div class="cart-group-label">${MOMENT_ICONS[moment]} ${MOMENT_LABELS[moment]}</div>`;

    gids.forEach(id => {
      const def = getItemDef(id);
      if (!def) return;
      total += def.precio || 0;

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
          <div class="cart-item-price">${def.precio ? fmt(def.precio) : "—"}</div>
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

  subtotalEl.textContent = fmt(total);
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

    const sub = planSubtotal(planKey);
    const dcto = state.discounts[planKey] || 0;
    const finalTotal = Math.round(sub * (1 - dcto / 100));

    col.innerHTML = `
      <div class="plan-col-head plan-head-${planKey}">
        <div class="plan-col-title">${PLAN_LABELS[planKey]}</div>
        <div class="plan-col-total">${fmt(finalTotal)}</div>
        <div class="plan-discount-row">
          <span class="plan-dcto-label">Dcto:</span>
          <div class="plan-dcto-wrap">
            <input
              type="number"
              class="plan-dcto-input"
              value="${dcto}"
              min="0" max="100" step="0.5"
              data-plan="${planKey}"
              onchange="setPlanDiscount('${planKey}', this.value)"
              oninput="setPlanDiscount('${planKey}', this.value)"
            />
            <span class="plan-dcto-pct">%</span>
          </div>
        </div>
        ${sub > 0 ? `<div class="plan-col-sub">Subtotal ${fmt(sub)}</div>` : ""}
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
      const pill = document.createElement("div");
      pill.className = "plan-item-pill";
      pill.draggable = true;
      pill.dataset.id = id;
      pill.dataset.plan = planKey;
      pill.innerHTML = `
        <div class="pill-left">
          <span class="pill-moment-icon">${MOMENT_ICONS[effectiveMoment] || "🎵"}</span>
          <div class="pill-info">
            <div class="pill-name">${def.nombre}</div>
            <div class="pill-price">${def.precio ? fmt(def.precio) : "—"}</div>
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

function setPlanDiscount(planKey, value) {
  state.discounts[planKey] = parseFloat(value) || 0;
  const sub = planSubtotal(planKey);
  const dcto = state.discounts[planKey];
  const finalTotal = Math.round(sub * (1 - dcto / 100));
  const totalEl = document.querySelector(`.plan-col-${planKey} .plan-col-total`);
  const subEl = document.querySelector(`.plan-col-${planKey} .plan-col-sub`);
  if (totalEl) totalEl.textContent = fmt(finalTotal);
  if (subEl) subEl.textContent = `Subtotal ${fmt(sub)}`;
}

function removeFromPlan(planKey, id) {
  state.plans[planKey].delete(id);
  renderPlanBuilder();
}

// ── TABS ────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const moment = btn.dataset.moment;
      state.activeMoment = moment;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".moment-section").forEach(s => s.classList.remove("active"));
      document.getElementById(`section-${moment}`).classList.add("active");
    });
  });
}

// ── CEREMONY ────────────────────────────────────────────────
function updateCeremonyUI() {
  const badge = document.getElementById("ceremony-badge");
  const note = document.getElementById("sound-note");
  const isCatolica = state.event.ceremonyType === "catolica";
  if (badge) badge.textContent = isCatolica ? "Católica (Capilla)" : state.event.ceremonyType === "simbolica" ? "Simbólica" : "Cristiana";
  if (note) {
    note.style.display = isCatolica ? "block" : "none";
    if (isCatolica) note.textContent = "En capilla católica el sonido no se cobra.";
  }
  if (isCatolica && state.cart["c-sonido"]) {
    delete state.cart["c-sonido"];
    ["basico","elite","premium"].forEach(p => state.plans[p].delete("c-sonido"));
  }
}

// ── CONFIG ──────────────────────────────────────────────────
function setupConfig() {
  document.getElementById("btn-open-config").addEventListener("click", () => {
    document.getElementById("modal-config").classList.add("open");
  });
  document.getElementById("btn-close-config").addEventListener("click", () => {
    document.getElementById("modal-config").classList.remove("open");
  });
  document.getElementById("btn-save-config").addEventListener("click", () => {
    state.event.couple = document.getElementById("cfg-couple").value;
    state.event.city = document.getElementById("cfg-city").value;
    state.event.date = document.getElementById("cfg-date").value;
    state.event.start = document.getElementById("cfg-start").value;
    state.event.end = document.getElementById("cfg-end").value;
    state.event.ceremonyType = document.getElementById("cfg-ceremony").value;
    document.getElementById("modal-config").classList.remove("open");
    updateHeaderDisplay();
    updateCeremonyUI();
    renderAllGrids();
    renderCart();
    renderPlanBuilder();
  });
}

function updateHeaderDisplay() {
  const ev = state.event;
  const coupleEl = document.getElementById("display-couple");
  const metaEl = document.getElementById("display-meta");
  if (coupleEl) coupleEl.textContent = ev.couple || "Novios";
  if (metaEl) metaEl.textContent = `${ev.city} · ${formatDate(ev.date)} · ${formatTime(ev.start)}–${formatTime(ev.end)}`;
}

// ── GENERATE QUOTE ──────────────────────────────────────────
function generateQuote() {
  const hasItems = PLAN_KEYS.some(p => state.plans[p].size > 0);
  if (!hasItems) {
    alert("Arrastra al menos un ítem a los planes antes de generar la cotización.");
    return;
  }

  const ev = state.event;

  // ── PÁGINA 1: Header + Planes ──────────────────────
  let html = `<div class="quote-page quote-page-1">`;

  html += `
    <div class="quote-doc-header">
      <div class="qdh-left">
        <div class="qdh-label">COTIZACIÓN MATRIMONIO</div>
        <div class="q-couple">${ev.couple}</div>
        <div class="q-meta">
          Lugar: ${ev.city}<br>
          Fecha: ${formatDate(ev.date)}<br>
          Hora: ${formatTime(ev.start)} – ${formatTime(ev.end)}
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
    const items = [...state.plans[key]].map(id => getItemDef(id)).filter(Boolean);
    if (items.length === 0) return;

    const subtotal = items.reduce((s, i) => s + (i.precio || 0), 0);
    const dcto = state.discounts[key] || 0;
    const total = Math.round(subtotal * (1 - dcto / 100));

    const byMoment = {};
    items.forEach(item => {
      const m = getEffectiveMoment(item.id);
      if (!byMoment[m]) byMoment[m] = [];
      byMoment[m].push(item);
    });

    html += `<div class="plan-card plan-${key}">
      <div class="plan-head">
        <h4>${PLAN_LABELS[key]}</h4>
      </div>
      <div class="plan-body">`;

    MOMENT_ORDER.forEach(moment => {
      const mItems = byMoment[moment];
      if (!mItems || mItems.length === 0) return;
      html += `<div class="plan-moment-group">
        <div class="plan-moment-label">${MOMENT_ICONS[moment]} ${MOMENT_LABELS[moment].toUpperCase()}</div>`;
      mItems.forEach(item => {
        const hrs = item.horas ? `${item.horas}h` : (item.duracion || "");
        html += `<div class="plan-item-row">
          <span class="pi-name">${item.nombre}</span>
          <span class="pi-hrs">${hrs}</span>
          <span class="pi-price">${item.precio ? fmt(item.precio) : "—"}</span>
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

  // Footer página 1
  html += `
    <div class="quote-footer-p1">
      <div class="qf-company">
        <strong>DIGITAL STRINGS SAS</strong><br>
        NIT 901645682<br>
        Cr 58 # 125b - 29 · Bogotá · Colombia<br><br>
        <strong>JOSE LUIS DIAZ</strong><br>
        Director Musical
      </div>
      <div class="qf-tagline">YOUR TIME<br>YOUR<br>PLEASURE</div>
    </div>
    <div class="qf-contacts">
      <span>📸 digitalstringsmusic</span>
      <span>📞 +57 3114513734</span>
      <span>✉ digitalstringsmusic@gmail.com</span>
    </div>
  `;

  html += `</div>`; // end page 1

  // ── PÁGINA 2: Consideraciones ───────────────────────
  html += `<div class="quote-page quote-page-2">`;

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
        <li><em>Esta cotización está hecha para el desarrollo del evento en Bogotá, si la locación se encuentra fuera del perímetro tendrá un aumento del 20% o 30% según las condiciones de la hacienda.</em></li>
      </ul>
    </div>

    <div class="quote-footer-p2">
      <div class="qf2-left">
        <div class="qf2-company">
          <strong>DIGITAL STRINGS SAS</strong><br>
          NIT 901645682<br>
          Cr 58 # 125b - 29<br>
          Oficina
        </div>
        <div class="qf2-director" style="margin-top:14px;">
          <strong>JOSE LUIS DIAZ</strong><br>
          Director Musical<br>
          Bogotá · Colombia
        </div>
      </div>
      <div class="qf2-center">
        <img src="QR.png" alt="QR" class="qr-img">
      </div>
      <div class="qf2-right">
        <div class="qf2-tagline">YOUR TIME<br>YOUR<br>PLEASURE</div>
      </div>
    </div>

    <div class="qf2-contacts">
      <span>📷 digitalstringsmusic</span>
      <span>📞 +57 3114513734</span>
      <span>✉ digitalstringsmusic@gmail.com</span>
    </div>
  `;

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
    renderCart();
    renderAllGrids();
    renderPlanBuilder();
  }
});

document.getElementById("btn-clear-plans")?.addEventListener("click", () => {
  if (confirm("¿Limpiar los 3 planes?")) {
    state.plans = { basico: new Set(), elite: new Set(), premium: new Set() };
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
  updateCeremonyUI();
  updateHeaderDisplay();

  document.getElementById("cfg-couple").value = state.event.couple;
  document.getElementById("cfg-city").value = state.event.city;
  document.getElementById("cfg-date").value = state.event.date;
  document.getElementById("cfg-start").value = state.event.start;
  document.getElementById("cfg-end").value = state.event.end;
  document.getElementById("cfg-ceremony").value = state.event.ceremonyType;

  renderPlanBuilder();
}

document.addEventListener("DOMContentLoaded", init);