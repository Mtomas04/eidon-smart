// Botón de arrepentimiento / baja: genera el código de trámite, lo envía con la
// solicitud (queda en Netlify Forms) y lo muestra en el momento (Disposición 954/2025).
const form = document.getElementById("tramite-form");
const status = document.getElementById("tramite-status");

// #baja o #arrepentimiento en el link dejan elegida la opción
const preelegido = { "#baja": "tipo-baja", "#arrepentimiento": "tipo-arrepentimiento" }[location.hash];
if (preelegido) document.getElementById(preelegido).checked = true;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const fecha = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const azar = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0, 5);
  const codigo = `EID-${fecha}-${azar}`;
  document.getElementById("tramite-codigo").value = codigo;

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = "Enviando…";
  try {
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString(),
    });
    if (!response.ok) throw new Error(`Netlify Forms respondió ${response.status}`);
    document.getElementById("tramite-codigo-ok").textContent = codigo;
    form.hidden = true;
    location.hash = "recibido";
  } catch {
    button.disabled = false;
    status.textContent = "No se pudo enviar. Escribinos a contacto@eidonsmart.com con el asunto “Arrepentimiento” o “Baja” y te respondemos con el código en menos de 24 horas.";
  }
});
