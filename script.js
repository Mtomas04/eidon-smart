import { CONFIG } from "./config.js";

// ---------------------------------------------------------------------------
// Contacto — todo sale de config.js, así que no hay que buscar el email
// a mano por el código cuando cambie el dominio.
// ---------------------------------------------------------------------------
const emailLink = document.getElementById("contact-email-link");
if (emailLink) {
  emailLink.href = `mailto:${CONFIG.contactEmail}`;
  emailLink.textContent = `${CONFIG.contactEmail} ↗`;
}

const socialRow = document.getElementById("social-links");
if (socialRow) {
  socialRow.innerHTML = `
    <a href="${CONFIG.social.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
    <a href="${CONFIG.social.instagram}" target="_blank" rel="noopener">Instagram</a>
  `;
}

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const process = document.getElementById("process").value;
    const subject = encodeURIComponent(`Consulta de ${name} — automatización`);
    const body = encodeURIComponent(`${process}\n\nResponder a: ${email}`);
    window.location.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;
  });
}

// ---------------------------------------------------------------------------
// Calculadora — estimación simple y editable, sin pretender ser un estudio.
// ---------------------------------------------------------------------------
const RATES = {
  // Conversión aproximada solo para que la cifra se sienta local.
  // No son tipos de cambio en vivo — si hace falta precisión real,
  // conectar a una API de cotización más adelante.
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
  const yearlyMoneySaved = weeklyHoursSaved * rate * 52 * RATES[currentCurrency].factor;

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
    currentCurrency = btn.dataset.currency;
    updateCalc();
  });
});

updateCalc();

// ---------------------------------------------------------------------------
// FAQ — acordeón simple, accesible por teclado (son <button>).
// ---------------------------------------------------------------------------
document.querySelectorAll(".faq-item").forEach((item) => {
  const question = item.querySelector(".faq-q");
  question.addEventListener("click", () => {
    const isOpen = item.classList.contains("is-open");
    document.querySelectorAll(".faq-item").forEach((other) => {
      other.classList.remove("is-open");
      other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
    });
    if (!isOpen) {
      item.classList.add("is-open");
      question.setAttribute("aria-expanded", "true");
    }
  });
});
