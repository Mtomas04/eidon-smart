// Lógica pura de cálculo, sin DOM, para poder testearla con Node.
const Calc = {
  sum(items) {
    return items.reduce((acc, i) => acc + (Number(i.monto) || 0), 0);
  },

  // Costo por hora antes de margen e impuestos.
  costoPorHora({ fijos, variables, horasMes }) {
    const h = Number(horasMes) || 0;
    if (h <= 0) return 0;
    return (fijos + variables) / h;
  },

  // Precio final por hora, aplicando margen de ganancia y "gross-up" de impuestos
  // (así el impuesto se calcula sobre el precio final, no sobre el costo).
  precioPorHora({ costo, margenPct, impuestosPct }) {
    const margen = Math.max(0, Number(margenPct) || 0);
    let impuestos = Number(impuestosPct) || 0;
    impuestos = Math.min(Math.max(impuestos, 0), 99); // evita división por cero o negativos
    const conMargen = costo * (1 + margen / 100);
    return conMargen / (1 - impuestos / 100);
  },
};

if (typeof module !== "undefined") module.exports = Calc;
