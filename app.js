// Interacciones de la home (diseño de Claude Design pasado a JS plano, sin framework).
// Lo común a todas las páginas (aparición, tarjetas, progreso, CTA fijo) está en site.js.
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const nf = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

// ---------------------------------------------------------------- scroll: el tablero de la demo y la línea del proceso
const board = $("#board");
const steps = $("#steps");
function onScroll() {
  const vh = innerHeight;
  // el tablero de la demo se "levanta" a medida que entra en pantalla
  const pb = Math.min(1, Math.max(0, (vh - board.getBoundingClientRect().top) / (vh * 0.9)));
  board.style.setProperty("--bx", `${58 - pb * 40}deg`);
  board.style.setProperty("--bz", `${-14 + pb * 10}deg`);
  const top = steps.getBoundingClientRect().top;
  steps.style.setProperty("--progress", calm ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - top) / (vh * 0.6))).toFixed(3));
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------------------------------------------------------------- probalo: simulación del flujo de leads
// Leads inventados; los pasos y destinos son los del flujo real del caso.
const LEADS = [
  { name: "Martina · Estudio contable", msg: "Necesitamos cargar 300 facturas por mes al sistema sin hacerlo a mano.", res: "alta", score: 92 },
  { name: "Julián", msg: "Hola, ¿cuánto sale?", res: "dudosa", score: 48 },
  { name: "promo-bot", msg: "Ganá dinero rápido con cripto, hacé clic acá.", res: "nula", score: 3 },
  { name: "Carla · E-commerce de indumentaria", msg: "Queremos que los pedidos de WhatsApp entren solos a la planilla y avisen a depósito.", res: "alta", score: 88 },
];
const RESULT = {
  alta: { label: "de alta calidad", note: "El equipo ya tiene la alerta en Telegram.", dest: "Sheets ✓  Gmail ✓  Telegram ✓", outs: ["sheets", "gmail", "telegram"] },
  dudosa: { label: "dudoso", note: "Registrado para seguimiento.", dest: "Sheets ✓ · queda para revisar", outs: ["sheets"] },
  nula: { label: "descartado", note: "Spam filtrado automáticamente.", dest: "Descartado · no molesta al equipo", outs: [] },
};
const runBtn = $("#run-demo");
const logEl = $("#log");
const stageEls = $$(".stage-node");
const outEls = $$(".out");
let processed = 0;
let timers = [];

function setStage(n) {
  stageEls.forEach((el, i) => {
    el.classList.toggle("active", i === n);
    el.classList.toggle("done", i < n);
  });
}
function logLine(t0, text) {
  $(".log-empty", logEl)?.remove();
  const line = document.createElement("span");
  const t = document.createElement("span");
  t.className = "t";
  t.textContent = `+${String(Math.round(performance.now() - t0)).padStart(4, "0")}ms`;
  line.append(t, text);
  logEl.append(line);
}

runBtn.addEventListener("click", () => {
  timers.forEach(clearTimeout);
  const lead = LEADS[processed % LEADS.length];
  const r = RESULT[lead.res];
  const t0 = performance.now();
  const at = (ms, fn) => timers.push(setTimeout(fn, calm ? 0 : ms));

  runBtn.disabled = true;
  $("span", runBtn).textContent = "Procesando…";
  $("#lead-name").textContent = lead.name;
  $("#lead-msg").textContent = `“${lead.msg}”`;
  $("#result").hidden = true;
  logEl.replaceChildren();
  outEls.forEach((o) => o.classList.remove("on"));
  setStage(0);
  logLine(t0, `Formulario recibido · ${lead.name}`);

  at(800, () => { setStage(1); logLine(t0, "Gemini Flash analiza la intención del mensaje…"); });
  at(1800, () => { setStage(2); logLine(t0, `Smart Filter · score ${lead.score}/100 → ${lead.res.toUpperCase()}`); });
  at(2700, () => {
    setStage(3);
    logLine(t0, r.dest);
    outEls.forEach((o) => o.classList.toggle("on", r.outs.includes(o.dataset.out)));
  });
  at(3400, () => {
    processed++;
    $("#demo-count").textContent = processed;
    $("#result-tag").textContent = `Lead ${r.label} · score ${lead.score}/100`;
    $("#result-note").textContent = r.note;
    $("#result").hidden = false;
    runBtn.disabled = false;
    $("span", runBtn).textContent = "Mandar otro lead";
  });
});

// ---------------------------------------------------------------- calculadora
// Tasas aproximadas solo para que la cifra se sienta local; no son cotizaciones en vivo.
const CUR = {
  USD: { sym: "US$ ", rate: [5, 100, 1], def: 20 },
  ARS: { sym: "$ ", rate: [2000, 60000, 500], def: 20000 },
  COP: { sym: "COL$ ", rate: [10000, 300000, 1000], def: 80000 },
};
const HOURS_FTE = 1880; // horas de trabajo de una persona por año
const AI_PLAN = { build: 500, monthly: 35 }; // plan "Flujo con IA", para el cálculo de repago
let currency = "USD";
const inp = { people: $("#calc-people"), hours: $("#calc-hours"), rate: $("#calc-rate"), pct: $("#calc-pct") };

function updateCalc() {
  const { sym } = CUR[currency];
  const people = +inp.people.value, hours = +inp.hours.value, rate = +inp.rate.value, pct = +inp.pct.value;
  $("#out-people").textContent = people;
  $("#out-hours").textContent = `${hours} h`;
  $("#out-rate").textContent = sym + nf.format(rate);
  $("#out-pct").textContent = `${pct}%`;

  const hoursYear = (people * hours * 52 * pct) / 100;
  const money = hoursYear * rate;
  $("#calc-money").textContent = sym + nf.format(money);
  $("#calc-hours-year").textContent = nf.format(hoursYear);
  $("#calc-fte").textContent = (hoursYear / HOURS_FTE).toFixed(1).replace(".", ",");

  // repago: lo ahorrado por semana, descontando el abono, contra el costo de construcción
  const weeklyNet = money / 52 - (AI_PLAN.monthly * 12) / 52;
  const weeks = weeklyNet > 0 ? Math.ceil(AI_PLAN.build / weeklyNet) : 0;
  const payback = $("#payback");
  payback.hidden = currency !== "USD" || weeks <= 0;
  $("span", payback).textContent =
    `Con esos números, un Flujo con IA (US$ ${AI_PLAN.build} + US$ ${AI_PLAN.monthly}/mes) se pagaría en ~${weeks <= 1 ? "1 semana" : `${weeks} semanas`}.`;
}
Object.values(inp).forEach((el) => el.addEventListener("input", updateCalc));
$$(".seg button").forEach((btn) =>
  btn.addEventListener("click", () => {
    currency = btn.dataset.currency;
    $$(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    const [min, max, step] = CUR[currency].rate;
    Object.assign(inp.rate, { min, max, step });
    inp.rate.value = CUR[currency].def;
    $("#rate-cur").textContent = currency;
    updateCalc();
  })
);
updateCalc();

// el botón del resultado lleva la estimación al formulario, para que no arranque en blanco
$("#calc-cta").addEventListener("click", () => {
  const f = $("#process");
  if (f.value.trim()) return;
  f.value = `Somos ${inp.people.value} personas con unas ${inp.hours.value} h/semana de tareas manuales cada una. ` +
    `La calculadora estima ${$("#calc-money").textContent}/año (${$("#calc-hours-year").textContent} h) recuperables. El proceso es: `;
});

// ---------------------------------------------------------------- planes: mensual / anual
$$(".pill-toggle button").forEach((btn) =>
  btn.addEventListener("click", () => {
    $$(".pill-toggle button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    $$(".fee").forEach((f) => (f.textContent = f.dataset[btn.dataset.billing]));
  })
);

// cada botón de plan deja ese plan elegido en el formulario
$$("[data-plan]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const radio = $(`.pills input[value="${btn.dataset.plan}"]`);
    if (radio) radio.checked = true;
  })
);

// ---------------------------------------------------------------- contacto → Netlify Forms, sin recargar
$("#contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const err = $("#form-error");
  if (!f.name.value.trim() || !/^\S+@\S+\.\S+$/.test(f.email.value) || !f.process.value.trim()) {
    err.textContent = "Completá nombre, un email válido y el proceso que querés automatizar.";
    return;
  }
  if (!f.consent.checked) {
    err.textContent = "Necesitamos que aceptes la Política de Privacidad para responderte.";
    return;
  }
  const btn = $('button[type="submit"]', f);
  btn.disabled = true;
  err.textContent = "Enviando…";
  try {
    const res = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(f)).toString(),
    });
    if (!res.ok) throw new Error(`Netlify Forms respondió ${res.status}`);
    location.href = "/gracias.html"; // página propia: Cloudflare Analytics la cuenta como conversión
  } catch {
    btn.disabled = false;
    err.textContent = "No se pudo enviar. Escribinos directo a contacto@eidonsmart.com.";
  }
});

// ---------------------------------------------------------------- hero 3D
// En celular se carga cuando la página ya terminó y el navegador está libre: el texto y los botones
// responden primero. Con poca memoria (≤ 2 GB) no se carga y queda el fondo de puntos.
const loadHero = () => import("./hero3d.js");
if (innerWidth >= 900) loadHero();
else if (!(navigator.deviceMemory <= 2)) {
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(loadHero, { timeout: 3000 }) : setTimeout(loadHero, 1500));
  document.readyState === "complete" ? idle() : addEventListener("load", idle, { once: true });
}
