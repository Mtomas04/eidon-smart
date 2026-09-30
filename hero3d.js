// Hero 3D. Adelante: el flujo real de leads (Formulario → Gemini → Filtro →
// Sheets/Gmail/Telegram) con sus etiquetas, como lo diseñó Claude Design.
// Atrás: una red tenue en capas por la que corren pulsos, como datos moviéndose.
// three.js va alojado en /vendor para no sumar un CDN a la CSP.
import * as T from "./vendor/three.module.min.js";

const canvas = document.getElementById("hero-3d");
const hero = canvas.parentElement;
const stage = document.getElementById("hero-stage");
const countEl = document.getElementById("hero-count");
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
} catch {
  canvas.remove(); // sin WebGL queda el fondo con puntos y degradés, que también funciona
}

if (renderer) {
  const css = getComputedStyle(document.documentElement);
  const cv = (n) => new T.Color(css.getPropertyValue(n).trim());
  const ACC = cv("--a"), HI = cv("--a-300"), SURF = cv("--surface"), DIM = cv("--n-600"), DEEP = cv("--a-700");

  const scene = new T.Scene();
  scene.fog = new T.Fog(cv("--bg"), 9, 24);
  const cam = new T.PerspectiveCamera(38, 1, 0.1, 100);
  cam.position.set(0, 0.4, 11);
  scene.add(new T.AmbientLight(0xc9b8a6, 0.6));
  const l1 = new T.PointLight(ACC, 3, 30, 0); l1.position.set(3, 4, 6); scene.add(l1);
  const l2 = new T.PointLight(DEEP, 2, 30, 0); l2.position.set(-5, -3, 4); scene.add(l2);

  const glowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d");
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,255,255,.5)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();
  const additive = { map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending };

  // ============================================================ red de fondo
  const bg = new T.Group();
  bg.position.z = -7;
  scene.add(bg);
  const LAYERS = [3, 6, 8, 8, 6, 3];
  const bnodes = [];
  LAYERS.forEach((count, layer) => {
    const x = (layer / (LAYERS.length - 1) - 0.5) * 22;
    const radius = 1.5 + Math.sin((layer / (LAYERS.length - 1)) * Math.PI) * 4;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + layer * 0.7;
      const r = radius * (0.7 + Math.random() * 0.4);
      const base = new T.Vector3(x + (Math.random() - 0.5), Math.cos(a) * r, Math.sin(a) * r);
      bnodes.push({ base, pos: base.clone(), layer, phase: Math.random() * 6.28, heat: 0 });
    }
  });
  const bedges = [];
  bnodes.forEach((n, ia) => {
    bnodes
      .map((m, ib) => ({ m, ib }))
      .filter(({ m }) => m.layer === n.layer + 1)
      .sort((p, q) => p.m.base.distanceTo(n.base) - q.m.base.distanceTo(n.base))
      .slice(0, 2)
      .forEach(({ ib }) => bedges.push({ a: ia, b: ib, bend: new T.Vector3(0, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5) }));
  });
  const nodeGeo = new T.BufferGeometry();
  const nodePos = new Float32Array(bnodes.length * 3);
  const nodeCol = new Float32Array(bnodes.length * 3);
  nodeGeo.setAttribute("position", new T.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute("color", new T.BufferAttribute(nodeCol, 3));
  bg.add(new T.Points(nodeGeo, new T.PointsMaterial({ size: 0.9, vertexColors: true, ...additive })));

  const SEG = 12;
  const edgePos = new Float32Array(bedges.length * SEG * 6);
  const edgeGeo = new T.BufferGeometry();
  edgeGeo.setAttribute("position", new T.BufferAttribute(edgePos, 3));
  bg.add(new T.LineSegments(edgeGeo, new T.LineBasicMaterial({ color: HI, transparent: true, opacity: 0.09, depthWrite: false })));

  const tmpM = new T.Vector3();
  const edgePoint = (e, t, out) => {
    const a = bnodes[e.a].pos, b = bnodes[e.b].pos;
    tmpM.addVectors(a, b).multiplyScalar(0.5).add(e.bend);
    const u = 1 - t;
    return out.set(
      u * u * a.x + 2 * u * t * tmpM.x + t * t * b.x,
      u * u * a.y + 2 * u * t * tmpM.y + t * t * b.y,
      u * u * a.z + 2 * u * t * tmpM.z + t * t * b.z
    );
  };
  const outgoing = bnodes.map((_, i) => bedges.flatMap((e, k) => (e.a === i ? [k] : [])));
  const MAXP = 60;
  const bpulses = [];
  const pulseGeo = new T.BufferGeometry();
  const pulsePos = new Float32Array(MAXP * 3);
  pulseGeo.setAttribute("position", new T.BufferAttribute(pulsePos, 3));
  bg.add(new T.Points(pulseGeo, new T.PointsMaterial({ size: 0.8, color: ACC, ...additive })));
  const fireBg = (i) => {
    bnodes[i].heat = 1;
    const outs = outgoing[i];
    if (!outs.length || bpulses.length >= MAXP) return;
    const picks = outs.length > 1 && Math.random() < 0.4 ? outs : [outs[(Math.random() * outs.length) | 0]];
    picks.forEach((edge) => bpulses.length < MAXP && bpulses.push({ edge, t: 0, sp: 0.4 + Math.random() * 0.3 }));
  };
  const bgTriggers = bnodes.flatMap((n, i) => (n.layer === 0 ? [i] : []));

  // ============================================================ flujo real (adelante)
  const flow = new T.Group();
  scene.add(flow);
  const defs = [
    { label: "Formulario web", p: [-3.6, -0.2, 0.6], geo: new T.BoxGeometry(0.8, 0.8, 0.8) },
    { label: "Gemini Flash", p: [-1.3, 1.1, -0.6], geo: new T.IcosahedronGeometry(0.6, 0), ai: true },
    { label: "Smart Filter", p: [0.9, -0.3, 0.4], geo: new T.OctahedronGeometry(0.6, 0) },
    { label: "Google Sheets", p: [3.3, 1.5, -0.6], geo: new T.BoxGeometry(0.6, 0.6, 0.6) },
    { label: "Gmail", p: [3.7, -0.1, 0.8], geo: new T.BoxGeometry(0.6, 0.6, 0.6) },
    { label: "Telegram", p: [3.1, -1.7, -0.2], geo: new T.BoxGeometry(0.6, 0.6, 0.6) },
  ];
  const nodes = defs.map((d) => {
    const n = new T.Group();
    n.position.set(...d.p);
    const mat = new T.MeshStandardMaterial({ color: SURF, metalness: 0.4, roughness: 0.3, emissive: ACC, emissiveIntensity: 0.12, flatShading: true });
    const core = new T.Mesh(d.geo, mat);
    const edges = new T.LineSegments(new T.EdgesGeometry(d.geo), new T.LineBasicMaterial({ color: HI, transparent: true, opacity: 0.8 }));
    n.add(core, edges);
    let shell = null;
    if (d.ai) {
      shell = new T.Mesh(new T.IcosahedronGeometry(1.0, 1), new T.MeshBasicMaterial({ color: ACC, wireframe: true, transparent: true, opacity: 0.25 }));
      n.add(shell);
    }
    const halo = new T.Sprite(new T.SpriteMaterial({ color: ACC, opacity: 0.35, ...additive }));
    halo.scale.setScalar(2.4);
    n.add(halo);
    flow.add(n);
    const lab = document.createElement("div");
    lab.className = "node-label";
    lab.textContent = d.label;
    hero.appendChild(lab);
    return { n, core, mat, edges, shell, halo, lab, pulse: 0, spin: Math.random() * 2 };
  });
  const links = [[0, 1], [1, 2], [2, 3], [2, 4], [2, 5]].map(([a, b]) => {
    const A = new T.Vector3(...defs[a].p), B = new T.Vector3(...defs[b].p);
    const curve = new T.QuadraticBezierCurve3(A, A.clone().lerp(B, 0.5).add(new T.Vector3(0, 0.5, 0.6)), B);
    flow.add(new T.Mesh(new T.TubeGeometry(curve, 40, 0.018, 6, false), new T.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0.4 })));
    return { curve, to: b };
  });
  // paquetes: un lead entra, Gemini lo lee, el filtro decide a dónde va (alta → 3 destinos, dudosa → planilla, nula → se apaga)
  const packets = [];
  let leads = 0;
  const spawn = (li, cls) => {
    const s = new T.Sprite(new T.SpriteMaterial({ color: cls === "nula" ? DIM : HI, ...additive }));
    s.scale.setScalar(0.55);
    flow.add(s);
    packets.push({ s, li, t: 0, cls, sp: 0.55 + Math.random() * 0.2 });
  };

  // ============================================================ tamaño, mouse, visibilidad
  let w = 1, h = 1;
  const mouse = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  // ubica el flujo sobre la columna derecha (o debajo del texto en celular)
  function place() {
    w = hero.clientWidth;
    h = hero.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    const hr = hero.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const halfH = Math.tan(T.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
    const halfW = halfH * cam.aspect;
    const cx = ((sr.left + sr.width / 2 - hr.left) / w) * 2 - 1;
    const cy = 1 - ((sr.top + sr.height / 2 - hr.top) / h) * 2;
    flow.position.set(cx * halfW, cy * halfH + 0.2, 0);
    flow.scale.setScalar(Math.min(1, ((sr.width / w) * 2 * halfW) / 9.8));
  }
  new ResizeObserver(place).observe(hero);
  addEventListener("resize", place);
  place();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !calm) start(); }).observe(hero);

  // ============================================================ cuadro
  const clock = new T.Clock();
  let time = 0, spawnT = 0.3, bgT = 0;
  const v = new T.Vector3(), pt = new T.Vector3(), A = new T.Vector3(), B = new T.Vector3();

  function step(dt) {
    time += dt;
    const sp = Math.min(1, scrollY / 700);

    // --- red de fondo
    bnodes.forEach((n, i) => {
      n.pos.copy(n.base);
      n.pos.y += Math.sin(time * 0.6 + n.phase) * 0.2;
      n.heat = Math.max(0, n.heat - dt * 1.2);
      const c = DIM.clone().lerp(ACC, 0.15 + n.heat * 0.7).multiplyScalar(0.8);
      nodePos.set([n.pos.x, n.pos.y, n.pos.z], i * 3);
      nodeCol.set([c.r, c.g, c.b], i * 3);
    });
    nodeGeo.attributes.position.needsUpdate = nodeGeo.attributes.color.needsUpdate = true;
    bedges.forEach((e, k) => {
      for (let s = 0; s < SEG; s++) {
        edgePoint(e, s / SEG, A);
        edgePoint(e, (s + 1) / SEG, B);
        edgePos.set([A.x, A.y, A.z, B.x, B.y, B.z], (k * SEG + s) * 6);
      }
    });
    edgeGeo.attributes.position.needsUpdate = true;
    if ((bgT -= dt) <= 0) { fireBg(bgTriggers[(Math.random() * bgTriggers.length) | 0]); bgT = 0.5 + Math.random() * 0.6; }
    for (let i = bpulses.length - 1; i >= 0; i--) {
      const p = bpulses[i];
      if ((p.t += dt * p.sp) >= 1) { bpulses.splice(i, 1); fireBg(bedges[p.edge].b); }
    }
    bpulses.forEach((p, i) => { edgePoint(bedges[p.edge], p.t, pt); pulsePos.set([pt.x, pt.y, pt.z], i * 3); });
    pulseGeo.setDrawRange(0, bpulses.length);
    pulseGeo.attributes.position.needsUpdate = true;

    // --- flujo real
    if ((spawnT -= dt) <= 0) {
      spawnT = 1.1 + Math.random() * 0.6;
      const r = Math.random();
      spawn(0, r < 0.5 ? "alta" : r < 0.8 ? "dudosa" : "nula");
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += dt * p.sp;
      const L = links[p.li];
      if (p.t >= 1) {
        nodes[L.to].pulse = 1;
        flow.remove(p.s);
        p.s.material.dispose();
        packets.splice(i, 1);
        if (p.li === 0) spawn(1, p.cls);
        else if (p.li === 1) {
          if (p.cls === "alta") { spawn(2, p.cls); spawn(3, p.cls); spawn(4, p.cls); }
          else if (p.cls === "dudosa") spawn(2, p.cls);
        } else if (p.li === 2) countEl.textContent = ++leads; // cada lead que llega a la planilla
        continue;
      }
      L.curve.getPoint(p.t, p.s.position);
      if (p.cls === "nula" && p.li === 1) p.s.material.opacity = 1 - p.t * 0.7;
    }
    nodes.forEach((o, i) => {
      o.pulse *= 0.93;
      o.n.scale.setScalar(1 + o.pulse * 0.28);
      o.mat.emissiveIntensity = 0.12 + o.pulse * 0.9;
      o.halo.material.opacity = 0.25 + o.pulse * 0.6;
      o.core.rotation.set(time * 0.25 + o.spin, time * 0.35 + o.spin, 0);
      o.edges.rotation.copy(o.core.rotation);
      if (o.shell) { o.shell.rotation.y = -time * 0.4; o.shell.rotation.z = time * 0.2; }
      o.n.position.y = defs[i].p[1] + Math.sin(time * 0.9 + i) * 0.08;
    });

    // --- cámara / grupos: el mouse inclina, el scroll levanta y apaga
    cur.x += (mouse.x - cur.x) * 0.05;
    cur.y += (mouse.y - cur.y) * 0.05;
    flow.rotation.y = cur.x * 0.55 + Math.sin(time * 0.25) * 0.12 - 0.12;
    flow.rotation.x = cur.y * 0.25 + 0.08 + sp * 0.35;
    bg.rotation.y = Math.sin(time * 0.08) * 0.3 + cur.x * 0.2;
    bg.rotation.x = 0.1 + cur.y * 0.1;
    canvas.style.opacity = String(1 - sp * 0.6);
    renderer.render(scene, cam);

    // etiquetas pegadas a sus nodos
    nodes.forEach((o) => {
      o.n.getWorldPosition(v).project(cam);
      o.lab.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, 42px)`;
      o.lab.style.opacity = String(1 - sp * 0.8);
    });
  }

  let running = false;
  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    const tick = () => {
      if (!visible) { running = false; return; }
      step(Math.min(clock.getDelta(), 0.05));
      requestAnimationFrame(tick);
    };
    tick();
  }

  if (calm) for (let i = 0; i < 150; i++) step(1 / 30); // un cuadro fijo, sin animación
  else start();
}
