// Precio final por hora: margen sobre el costo y "gross-up" de impuestos
// (el impuesto se calcula sobre el precio final, no sobre el costo).
function precioPorHora(costo, margenPct, impuestosPct) {
  const impuestos = Math.min(Math.max(impuestosPct, 0), 99); // evita dividir por cero
  return (costo * (1 + Math.max(0, margenPct) / 100)) / (1 - impuestos / 100);
}

const sumAmounts = (list) => list.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

const STORAGE_KEY = "eidonsmart-calculadora-tarifa-v1";

const currencyPresets = {
  USD: {
    symbol: "US$",
    fixed: [
      { label: "Retiro neto personal", amount: 2200 },
      { label: "Infraestructura, VPS y n8n", amount: 90 },
      { label: "Software y conectividad", amount: 200 },
    ],
    variable: [
      { label: "APIs de IA (tokens y modelos)", amount: 110 },
      { label: "Hosting dinámico y proxies", amount: 45 },
    ],
  },
  ARS: {
    symbol: "$",
    fixed: [
      { label: "Retiro neto personal", amount: 2500000 },
      { label: "Infraestructura y servidores", amount: 120000 },
      { label: "Internet y herramientas", amount: 180000 },
    ],
    variable: [
      { label: "APIs y tokens de IA", amount: 140000 },
      { label: "Comisiones de cobro", amount: 90000 },
    ],
  },
  COP: {
    symbol: "$",
    fixed: [
      { label: "Retiro neto personal", amount: 7500000 },
      { label: "Servidores e instancias n8n", amount: 400000 },
      { label: "Herramientas y oficina", amount: 650000 },
    ],
    variable: [
      { label: "Consumo de modelos de IA", amount: 450000 },
      { label: "Gastos de transacción", amount: 300000 },
    ],
  },
};

let state = {
  currency: "USD",
  fixedExpenses: structuredClone(currencyPresets.USD.fixed),
  variableExpenses: structuredClone(currencyPresets.USD.variable),
  hours: 120,
  margin: 25,
  tax: 10,
};

function cargarEstado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) {
    console.warn("No se pudo leer lo guardado, se usan valores por defecto.", e);
  }
}

function guardarEstado() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("No se pudo guardar en este navegador.", e);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function formatNumber(num) {
  return Math.round(num).toLocaleString("es-AR");
}

function renderExpenseRows() {
  const fixedContainer = document.getElementById("fixed-expenses-list");
  const variableContainer = document.getElementById("variable-expenses-list");

  const rowHtml = (exp, idx, type) => `
    <div class="expense-row">
      <input type="text" value="${escapeHtml(exp.label)}" aria-label="Concepto" data-type="${type}" data-idx="${idx}" data-field="label" placeholder="Concepto" />
      <input type="number" min="0" value="${Number(exp.amount) || 0}" aria-label="Monto" data-type="${type}" data-idx="${idx}" data-field="amount" />
      <button type="button" data-remove="${type}" data-idx="${idx}" aria-label="Eliminar" title="Eliminar">×</button>
    </div>`;

  fixedContainer.innerHTML = state.fixedExpenses.map((e, i) => rowHtml(e, i, "fixed")).join("");
  variableContainer.innerHTML = state.variableExpenses.map((e, i) => rowHtml(e, i, "variable")).join("");

  updateCalculation();
}

function updateCalculation() {
  const { symbol } = currencyPresets[state.currency];
  const hours = parseFloat(document.getElementById("hours-slider").value) || 1;
  const marginPct = parseFloat(document.getElementById("margin-slider").value) || 0;
  const taxPct = parseFloat(document.getElementById("tax-slider").value) || 0;
  state.hours = hours;
  state.margin = marginPct;
  state.tax = taxPct;

  document.getElementById("hours-val").textContent = hours;
  document.getElementById("margin-val").textContent = marginPct;
  document.getElementById("tax-val").textContent = taxPct;

  const totalFixed = sumAmounts(state.fixedExpenses);
  const totalVariable = sumAmounts(state.variableExpenses);
  const totalCosts = totalFixed + totalVariable;

  document.getElementById("subtotal-fixed").textContent = `${symbol} ${formatNumber(totalFixed)}`;
  document.getElementById("subtotal-variable").textContent = `${symbol} ${formatNumber(totalVariable)}`;

  const hourlyRate = precioPorHora(totalCosts / hours, marginPct, taxPct);

  const requiredGrossBilling = hourlyRate * hours;
  const netProfit = totalCosts * (marginPct / 100);
  const breakevenHours = hourlyRate > 0 ? totalCosts / hourlyRate : 0;

  document.getElementById("hourly-rate").textContent = `${symbol} ${formatNumber(hourlyRate)}`;
  document.getElementById("monthly-gross").textContent = `${symbol} ${formatNumber(requiredGrossBilling)}`;
  document.getElementById("monthly-costs").textContent = `${symbol} ${formatNumber(totalCosts)}`;
  document.getElementById("monthly-profit").textContent = `+ ${symbol} ${formatNumber(netProfit)}`;
  document.getElementById("breakeven-hours").textContent = `${breakevenHours.toFixed(1)} hs/mes`;

  if (requiredGrossBilling > 0) {
    const costShare = Math.min(100, Math.max(5, (totalCosts / requiredGrossBilling) * 100));
    const marginShare = Math.min(100, Math.max(0, (netProfit / requiredGrossBilling) * 100));
    const taxShare = Math.max(0, 100 - costShare - marginShare);

    document.getElementById("bar-costs").style.width = `${costShare}%`;
    document.getElementById("bar-margin").style.width = `${marginShare}%`;
    document.getElementById("bar-tax").style.width = `${taxShare}%`;
    document.getElementById("pct-cost-label").textContent = `${Math.round(costShare)}%`;
    document.getElementById("pct-margin-label").textContent = `${Math.round(marginShare)}%`;
    document.getElementById("pct-tax-label").textContent = `${Math.round(taxShare)}%`;
  }

  guardarEstado();
}

function syncCurrencyButtons(currency) {
  document.querySelectorAll(".currency-group button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.currency === currency));
  });
}

// Cambiar de moneda carga los gastos de ejemplo de esa moneda.
function setCurrency(currency) {
  const preset = currencyPresets[currency];
  if (!preset) return;
  state.currency = currency;
  state.fixedExpenses = structuredClone(preset.fixed);
  state.variableExpenses = structuredClone(preset.variable);
  syncCurrencyButtons(currency);
  renderExpenseRows();
}

// Delegación de eventos: menos listeners, funciona con filas agregadas dinámicamente.
document.addEventListener("input", (e) => {
  const { type, idx, field } = e.target.dataset;
  if (!type || !field) return;
  const key = type + "Expenses";
  if (field === "amount") state[key][idx].amount = parseFloat(e.target.value) || 0;
  if (field === "label") state[key][idx].label = e.target.value;
  guardarEstado();
  if (field === "amount") updateCalculation();
});

document.addEventListener("click", (e) => {
  if (e.target.dataset.remove) {
    state[e.target.dataset.remove + "Expenses"].splice(Number(e.target.dataset.idx), 1);
    guardarEstado();
    renderExpenseRows();
  }
  if (e.target.dataset.add) {
    state[e.target.dataset.add + "Expenses"].push({ label: "Nuevo concepto", amount: 0 });
    guardarEstado();
    renderExpenseRows();
  }
  if (e.target.dataset.currency) setCurrency(e.target.dataset.currency);
});

["hours-slider", "margin-slider", "tax-slider"].forEach((id) =>
  document.getElementById(id).addEventListener("input", updateCalculation)
);

document.getElementById("reset-btn").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  document.getElementById("hours-slider").value = 120;
  document.getElementById("margin-slider").value = 25;
  document.getElementById("tax-slider").value = 10;
  setCurrency("USD");
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const rate = document.getElementById("hourly-rate").textContent;
  const gross = document.getElementById("monthly-gross").textContent;
  const text = `Eidon Smart — Tarifa por hora calculada: ${rate}/h (Facturación meta: ${gross}/mes sobre ${state.hours} hs facturables)`;
  const btn = document.getElementById("copy-btn");
  const flash = (msg) => {
    btn.textContent = msg;
    setTimeout(() => (btn.textContent = "Copiar cálculo"), 1800);
  };
  navigator.clipboard.writeText(text).then(() => flash("✓ Copiado"), () => flash("No se pudo copiar"));
});

cargarEstado();
if (!currencyPresets[state.currency]) state.currency = "USD";
document.getElementById("hours-slider").value = state.hours;
document.getElementById("margin-slider").value = state.margin;
document.getElementById("tax-slider").value = state.tax;
syncCurrencyButtons(state.currency);
renderExpenseRows(); // respeta los gastos guardados en vez de pisarlos con los de ejemplo
