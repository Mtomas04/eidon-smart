// Comportamiento común a todas las páginas: aparición al hacer scroll, tarjetas
// que se inclinan, barra de progreso y CTA flotante.
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("is-in"), io.unobserve(e.target))),
  { threshold: 0.12 }
);
document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

if (!calm && matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".tilt").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
      el.style.setProperty("--rx", `${(0.5 - y) * 9}deg`);
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
}

// el CTA flotante aparece después del primer pantallazo y se esconde cerca del formulario
const progress = document.getElementById("progress");
const sticky = document.getElementById("sticky-cta");
const contact = document.getElementById("contacto");
function onScroll() {
  const y = scrollY;
  const h = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.width = `${h > 0 ? (y / h) * 100 : 0}%`;
  if (sticky) sticky.classList.toggle("show", y > 700 && (!contact || contact.getBoundingClientRect().top > innerHeight * 0.8));
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// menú desplegable en celular
const header = document.querySelector(".site-header");
const toggle = header?.querySelector(".nav-toggle");
function setNav(open) {
  header.classList.toggle("nav-open", open);
  toggle.setAttribute("aria-expanded", open);
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}
toggle?.addEventListener("click", () => setNav(!header.classList.contains("nav-open")));
header?.querySelectorAll(".nav-links a").forEach((a) => a.addEventListener("click", () => setNav(false)));
addEventListener("keydown", (e) => e.key === "Escape" && toggle && setNav(false));

// origen de la visita (UTM o sitio de donde vino), guardado solo en esta pestaña; el formulario
// de contacto lo manda en un campo oculto para saber qué canal trae consultas
const q = new URLSearchParams(location.search);
const utm = ["utm_source", "utm_medium", "utm_campaign"].map((k) => q.get(k)).filter(Boolean).join(" / ");
let ref = "";
try { ref = document.referrer && new URL(document.referrer).hostname; } catch {}
if (ref === location.hostname) ref = "";
try {
  if ((utm || ref) && !sessionStorage.getItem("origen")) sessionStorage.setItem("origen", utm || ref);
  const campo = document.getElementById("origen");
  if (campo) campo.value = sessionStorage.getItem("origen") || "directo";
} catch {}
