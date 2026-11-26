/* MODELO · Experimento del obstáculo (Fig. 1 del artículo)
 *
 * Las hormigas van del hormiguero (N) a la comida (F) y vuelven. Entre J1 y J2 hay un camino directo
 * que un obstáculo puede cortar, dejando dos rodeos: uno corto (por U) y uno largo (por L).
 *
 *   N ── J1 ──┬── U ──┬── J2 ── F        (rodeo corto)
 *             ├── L ──┤                  (rodeo largo, ratio × la longitud del corto)
 *             └── D ──┘                  (directo; bloqueado por el obstáculo)
 *
 * Tiempo continuo: las hormigas avanzan a velocidad constante y depositan feromona mientras caminan.
 * Por el rodeo corto vuelven antes, así que lo refuerzan más veces por unidad de tiempo (autocatálisis).
 *   - Depósito: cada recorrido completo de una arista suma Q = 1 de feromona (como ANT-density, pero continuo).
 *   - Evaporación: τ ← ρ^dt · τ  (ρ = persistencia por segundo).
 *   - Elección en una bifurcación: P(e) ∝ (τe + τ0)^α, solo entre aristas que avanzan hacia el destino.
 */
(function (A) {
  'use strict';

  const SPEED = 30;          // unidades de escena por segundo
  const TAU0 = 3;            // rastro «de fondo» de cada rama (≈ 3 recorridos): evita que la 2.ª hormiga siga a la 1.ª
  const SPAWN_EVERY = 0.35;  // s entre hormigas nuevas al salir del hormiguero
  const SHORT_Y = -22;       // altura del rodeo corto
  const L0 = 46;              // longitud de media rodeo corto: unidad de referencia del depósito
const K_LOOP = 2 * (50 + 2 * 45.65 + 50); // longitud de un viaje de ida y vuelta por el rodeo corto
const WINDOW = 30;         // nº de decisiones recientes para medir el % por el rodeo corto

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  class ObstacleSim {
    constructor(params, seed) {
      this.p = Object.assign({ algo: 'quantity', m: 30, alpha: 2, rho: 0.97, ratio: 1.8 }, params);
      this.rand = mulberry32(seed >>> 0);
      this.nodes = {
        N: { x: 0, y: 0, st: 0 }, J1: { x: 50, y: 0, st: 1 }, U: { x: 90, y: SHORT_Y, st: 2 },
        L: { x: 90, y: 40, st: 2 }, J2: { x: 130, y: 0, st: 3 }, F: { x: 180, y: 0, st: 4 }
      };
      const E = (id, a, b) => ({ id: id, a: a, b: b, len: 1, tau: 0, blocked: false });
      this.edges = [E('NJ1', 'N', 'J1'), E('J1U', 'J1', 'U'), E('UJ2', 'U', 'J2'), E('J1L', 'J1', 'L'),
                    E('LJ2', 'L', 'J2'), E('J2F', 'J2', 'F'), E('D', 'J1', 'J2')];
      this.byId = {}; this.edges.forEach(e => { this.byId[e.id] = e; });
      this.blocked = false; this.everBlocked = false;
      this.t = 0; this.spawnT = 0; this.sampleT = 0;
      this.ants = [];
      this.window = [];                         // últimas decisiones 'U' | 'L'
      this.count = { U: 0, L: 0, D: 0 };        // decisiones acumuladas en J1
      this.hist = { short: [], pher: [] };      // series para la gráfica (1 muestra / 0.5 s)
      this._geometry();
    }

    _geometry() {
      const n = this.nodes, hu = Math.hypot(40, -SHORT_Y);
      const half = Math.max(hu * this.p.ratio, 41);
      n.L.y = Math.sqrt(half * half - 40 * 40);
      for (const e of this.edges) e.len = Math.hypot(n[e.a].x - n[e.b].x, n[e.a].y - n[e.b].y);
    }

    setParams(p) { Object.assign(this.p, p); if (p.ratio != null) this._geometry(); }

    // Coloca o quita el obstáculo. Las hormigas que iban por el camino directo dan media vuelta.
    setBlocked(b) {
      this.blocked = !!b;
      this.byId.D.blocked = this.blocked;
      if (!this.blocked) return;
      this.everBlocked = true;
      this.window = [];        // el % se mide solo con decisiones posteriores al obstáculo
      for (const a of this.ants) {
        if (a.edge.id === 'D') { const f = a.from; a.from = a.to; a.to = f; a.s = 1 - a.s; }
      }
    }

    _spawn() {
      this.ants.push({
        mode: 'out', edge: this.byId.NJ1, from: 'N', to: 'J1', s: 0, trip: [], tripLen: 0,
        phase: this.rand() * 6.28, off: (this.rand() - 0.5) * 3.2
      });
    }

    update(dt) { // dt en segundos de simulación
      let rem = dt;
      while (rem > 1e-9) { const h = Math.min(rem, 0.05); this._step(h); rem -= h; }
    }

    _step(h) {
      this.t += h;
      this.spawnT += h;
      if (this.ants.length < this.p.m && this.spawnT >= SPAWN_EVERY) { this.spawnT = 0; this._spawn(); }
      const evap = Math.pow(this.p.rho, h);
      for (const e of this.edges) e.tau *= evap;
      for (const a of this.ants) {
        const ds = SPEED * h / a.edge.len;
        // depósito mientras camina: density = constante por recorrido; quantity = ∝ 1/longitud de la arista
        const dep = this.p.algo === 'quantity' ? L0 / a.edge.len : this.p.algo === 'density' ? 1 : 0;
        a.edge.tau += ds * dep;
        a.s += ds; a.phase += h * 15;
        if (a.s >= 1) this._arrive(a);
      }
      this.sampleT += h;
      if (this.sampleT >= 0.5) { this.sampleT -= 0.5; this._sample(); }
    }

    _arrive(a) {
      const node = a.to, here = this.nodes[node];
      a.trip.push(a.edge); a.tripLen += a.edge.len;
      if (node === 'N') { // ANT-cycle: al cerrar el viaje deposita K/L en cada arista recorrida
        if (this.p.algo === 'cycle') { const q = K_LOOP / a.tripLen; for (const e of a.trip) e.tau += q; }
        a.trip = []; a.tripLen = 0;
      }
      if (node === 'N') a.mode = 'out'; else if (node === 'F') a.mode = 'back';
      const dir = a.mode === 'out' ? 1 : -1;
      const other = e => e.a === node ? e.b : e.a;
      let cands = this.edges.filter(e => !e.blocked && (e.a === node || e.b === node) && (this.nodes[other(e)].st - here.st) * dir > 0);
      if (!cands.length) cands = this.edges.filter(e => !e.blocked && (e.a === node || e.b === node)); // seguridad
      let sum = 0; const w = cands.map(e => { const v = Math.pow(e.tau + (this.p.tau0 != null ? this.p.tau0 : TAU0), this.p.alpha); sum += v; return v; });
      let r = this.rand() * sum, k = 0;
      while (k < cands.length - 1 && (r -= w[k]) > 0) k++;
      const e = cands[k];
      if (node === 'J1' && a.mode === 'out') {
        const c = e.id === 'J1U' ? 'U' : e.id === 'J1L' ? 'L' : 'D';
        this.count[c]++;
        if (c !== 'D') { this.window.push(c); if (this.window.length > WINDOW) this.window.shift(); }
      }
      a.edge = e; a.from = node; a.to = other(e); a.s = 0;
    }

    _sample() {
      const u = this.window.filter(c => c === 'U').length, tot = this.window.length;
      const tu = this.byId.J1U.tau, tl = this.byId.J1L.tau;
      const on = this.everBlocked; // antes del obstáculo no hay nada que medir
      this.hist.short.push(on && tot ? 100 * u / tot : null);
      this.hist.pher.push(on && tu + tl > 0.5 ? 100 * tu / (tu + tl) : null);
      if (this.hist.short.length > 3000) { this.hist.short.shift(); this.hist.pher.shift(); }
    }

    stats() {
      let up = 0, lo = 0, di = 0;
      for (const a of this.ants) {
        const id = a.edge.id;
        if (id === 'J1U' || id === 'UJ2') up++; else if (id === 'J1L' || id === 'LJ2') lo++; else if (id === 'D') di++;
      }
      const u = this.window.filter(c => c === 'U').length, tot = this.window.length;
      const tu = this.byId.J1U.tau, tl = this.byId.J1L.tau;
      return {
        t: this.t, blocked: this.blocked, up: up, lo: lo, di: di,
        pctShort: this.everBlocked && tot ? 100 * u / tot : null, nWindow: this.everBlocked ? tot : 0,
        pctPher: this.blocked && tu + tl > 0.5 ? 100 * tu / (tu + tl) : null
      };
    }
  }

  A.ObstacleSim = ObstacleSim;
})(window.AntApp = window.AntApp || {});
