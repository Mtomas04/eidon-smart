// ---------------------------------------------------------------------------
// Contacto — envío a Netlify Forms sin recargar la página.
// ---------------------------------------------------------------------------
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const encoded = new URLSearchParams(new FormData(contactForm)).toString();

    submitBtn.disabled = true;
    if (formStatus) formStatus.textContent = "Enviando…";

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encoded,
      });
      if (!response.ok) throw new Error(`Netlify Forms respondió ${response.status}`);

      // página propia: Cloudflare Analytics cuenta cada visita a /gracias como conversión
      location.href = "/gracias.html";
    } catch (err) {
      submitBtn.disabled = false;
      if (formStatus) {
        formStatus.textContent = `No se pudo enviar. Escribinos directo a contacto@eidonsmart.com.`;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Flujo del hero — reproduce en loop el recorrido de un lead por el flujo real.
// Con "reducir movimiento" activado queda el diagrama estático.
// ---------------------------------------------------------------------------
const flowSvg = document.querySelector("#flujo-real svg");
const flowStatus = document.getElementById("flow-status");
const flowCount = document.getElementById("flow-count");

if (flowSvg && flowStatus && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const LEVELS = ["caliente", "tibio", "frío"];
  const STEP_MS = 1100;
  const steps = [
    () => "▶ formulario recibido",
    () => "◆ Gemini Flash analizando el mensaje…",
    (level) => `◆ filtro: lead ${level}`,
    (level) => `✓ lead ${level} → Sheets · Gmail · Telegram`,
  ];
  const parts = flowSvg.querySelectorAll("[data-step]");
  let step = 0;
  let level = LEVELS[0];
  let processed = 0;

  setInterval(() => {
    if (step === 0) {
      parts.forEach((el) => el.classList.remove("is-active"));
      level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
    }
    if (step < steps.length) {
      parts.forEach((el) => {
        if (Number(el.dataset.step) === step) el.classList.add("is-active");
      });
      flowStatus.textContent = steps[step](level);
      if (step === steps.length - 1) flowCount.textContent = ++processed;
    }
    // un tick extra de pausa con todo encendido antes de reiniciar
    step = (step + 1) % (steps.length + 1);
  }, STEP_MS);
}

// ---------------------------------------------------------------------------
// Calculadora — estimación simple y editable, sin pretender ser un estudio.
// ---------------------------------------------------------------------------
const RATES = {
  // Conversión aproximada solo para que la cifra se sienta local.
  // No son tipos de cambio en vivo — si hace falta precisión real,
  // conectar a una API de cotización más adelante.
  // El rango de la tarifa por hora también se reescala por moneda: un "20"
  // tiene sentido en USD, pero en ARS o COP la tarifa real está en miles.
  USD: { symbol: "US$", factor: 1 },
  ARS: { symbol: "AR$", factor: 1000 },
  COP: { symbol: "COP$", factor: 4000 },
};

let currentCurrency = "USD";

const peopleInput = document.getElementById("calc-people");
const hoursInput = document.getElementById("calc-hours");
const rateInput = document.getElementById("calc-rate");
const recoveryInput = document.getElementById("calc-recovery");

const outPeople = document.getElementById("out-people");
const outHours = document.getElementById("out-hours");
const outRate = document.getElementById("out-rate");
const outRecovery = document.getElementById("out-recovery");

const calcMoney = document.getElementById("calc-money");
const calcHoursYear = document.getElementById("calc-hours-year");

function formatMoney(amount) {
  const { symbol } = RATES[currentCurrency];
  return `${symbol}${Math.round(amount).toLocaleString("es-AR")}`;
}

function updateCalc() {
  if (!peopleInput) return;

  const people = Number(peopleInput.value);
  const hours = Number(hoursInput.value);
  const rate = Number(rateInput.value);
  const recovery = Number(recoveryInput.value) / 100;

  outPeople.textContent = people;
  outHours.textContent = hours;
  outRate.textContent = rate;
  outRecovery.textContent = Math.round(recovery * 100);

  const weeklyHoursSaved = people * hours * recovery;
  const yearlyHoursSaved = Math.round(weeklyHoursSaved * 52);
  const yearlyMoneySaved = weeklyHoursSaved * rate * 52;

  calcHoursYear.textContent = yearlyHoursSaved.toLocaleString("es-AR");
  calcMoney.textContent = formatMoney(yearlyMoneySaved);
}

[peopleInput, hoursInput, rateInput, recoveryInput].forEach((input) => {
  if (input) input.addEventListener("input", updateCalc);
});

document.querySelectorAll(".currency-toggle button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".currency-toggle button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");

    const oldFactor = RATES[currentCurrency].factor;
    const newCurrency = btn.dataset.currency;
    const { factor } = RATES[newCurrency];

    // Reescalar la tarifa actual a la nueva moneda antes de tocar el min/max,
    // para no perder la proporción que el usuario ya había puesto.
    const scaledRate = Math.round((Number(rateInput.value) / oldFactor) * factor);

    rateInput.min = rateInput.step = factor;
    rateInput.max = factor * 100;
    rateInput.value = Math.min(Math.max(scaledRate, factor), factor * 100);

    currentCurrency = newCurrency;
    updateCalc();
  });
});

updateCalc();

// El botón del resultado lleva la estimación al formulario, para que no arranque en blanco.
document.getElementById("calc-cta")?.addEventListener("click", () => {
  const processField = document.getElementById("process");
  if (processField.value.trim()) return;
  processField.value =
    `Somos ${peopleInput.value} personas con unas ${hoursInput.value} h/semana de tareas manuales cada una. ` +
    `La calculadora estima ${calcMoney.textContent}/año (${calcHoursYear.textContent} h) recuperables. El proceso es: `;
});

// Los botones de cada plan dejan elegido ese plan en el formulario.
document.querySelectorAll("[data-plan]").forEach((btn) =>
  btn.addEventListener("click", () => (document.getElementById("plan").value = btn.dataset.plan))
);
