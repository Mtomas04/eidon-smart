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

// ---------------------------------------------------------------- pruébalo: simulación de la revisión de un lote
// Lotes y resultados inventados; las etapas son las del flujo que construimos.
const LOTES = [
  { name: "Lote L-2611-04 · Desengrasante DG-40", msg: "pH 11,8 · densidad 1,052 g/mL · materia activa 19,3 % · viscosidad 162 mPa·s", res: "fuera", falla: "viscosidad 162 mPa·s (máx. 150)" },
  { name: "Lote L-2611-05 · Desengrasante DG-40", msg: "pH 12,1 · densidad 1,048 g/mL · materia activa 18,7 % · viscosidad 120 mPa·s", res: "ok" },
  { name: "Lote P-0412 · Pintura látex interior", msg: "viscosidad 98 KU · sólidos 52 % · densidad 1,38 g/mL", res: "ok" },
  { name: "Lote A-077 · Adhesivo vinílico", msg: "pH 3,2 · sólidos 41 % · viscosidad 9.800 mPa·s", res: "fuera", falla: "pH 3,2 (mín. 4,0)" },
];
const RESULT = {
  ok: { label: "conforme", note: "El certificado está listo para firmar.", dest: "Registro ✓  Certificado ✓", outs: ["registro", "certificado"] },
  fuera: { label: "fuera de especificación", note: "Calidad recibió el aviso; el lote queda retenido.", dest: "Registro ✓  Aviso a Calidad ✓ · sin certificado", outs: ["registro", "calidad"] },
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
  const lead = LOTES[processed % LOTES.length];
  const r = RESULT[lead.res];
  const t0 = performance.now();
  const at = (ms, fn) => timers.push(setTimeout(fn, calm ? 0 : ms));

  runBtn.disabled = true;
  $("span", runBtn).textContent = "Procesando…";
  $("#lead-name").textContent = lead.name;
  $("#lead-msg").textContent = lead.msg;
  $("#result").hidden = true;
  logEl.replaceChildren();
  outEls.forEach((o) => o.classList.remove("on"));
  setStage(0);
  logLine(t0, `Resultados recibidos · ${lead.name}`);

  at(800, () => { setStage(1); logLine(t0, "La IA lee y ordena los resultados del equipo…"); });
  at(1800, () => { setStage(2); logLine(t0, lead.res === "ok" ? "Especificación · todos los ensayos cumplen" : `Especificación · no cumple: ${lead.falla}`); });
  at(2700, () => {
    setStage(3);
    logLine(t0, r.dest);
    outEls.forEach((o) => o.classList.toggle("on", r.outs.includes(o.dataset.out)));
  });
  at(3400, () => {
    processed++;
    $("#demo-count").textContent = processed;
    $("#result-tag").textContent = `Lote ${r.label}`;
    $("#result-note").textContent = r.note;
    $("#result").hidden = false;
    runBtn.disabled = false;
    $("span", runBtn).textContent = "Cargar otro lote";
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
  f.value = `Somos ${inp.people.value} personas con unas ${inp.hours.value} h/semana armando documentos a mano cada una. ` +
    `La calculadora estima ${$("#calc-money").textContent}/año (${$("#calc-hours-year").textContent} h) recuperables. El documento que más tiempo nos lleva es: `;
});

// ---------------------------------------------------------------- contacto → Netlify Forms, sin recargar
$("#contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const err = $("#form-error");
  if (!f.name.value.trim() || !/^\S+@\S+\.\S+$/.test(f.email.value) || !f.process.value.trim()) {
    err.textContent = "Completa nombre, un email válido y qué documento o tarea les lleva más tiempo.";
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
    err.textContent = "No se pudo enviar. Escríbenos directo a contacto@eidonsmart.com.";
  }
});

// ---------------------------------------------------------------- hero 3D
// Se carga con la primera interacción (mover el mouse, scrollear, tocar o una tecla), así el texto y los
// botones responden primero; aparece con un fundido. Con poca memoria (≤ 2 GB) no se carga y queda el fondo de puntos.
if (!(navigator.deviceMemory <= 2)) {
  const evs = ["pointermove", "scroll", "touchstart", "pointerdown", "keydown"];
  const go = () => { evs.forEach((ev) => removeEventListener(ev, go)); import("./hero3d.js"); };
  evs.forEach((ev) => addEventListener(ev, go, { once: true, passive: true }));
}
