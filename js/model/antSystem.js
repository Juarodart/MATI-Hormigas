/* MODELO · Ant System de Colorni, Dorigo y Maniezzo (ECAL91)
 *
 * τij(t+1) = ρ·τij(t) + Δτij               (1)  ρ = persistencia del rastro, como en el artículo
 * pij = [τij]^α·[ηij]^β / Σ[τ]^α·[η]^β     (2)  ηij = 1/dij
 * ANT-quantity: Δτk = Q1/dij  por arista recorrida, actualización en cada paso      (3)
 * ANT-density : Δτk = Q2      por arista recorrida, actualización en cada paso      (4)
 * ANT-cycle   : Δτk = Q3/Lk   por arista del tour, actualización al final del ciclo (5)
 *
 * Todas las hormigas avanzan en paralelo: un "paso" = cada hormiga mueve una ciudad.
 * Un ciclo = n pasos (n-1 elecciones probabilísticas + 1 cierre forzado hacia la ciudad inicial).
 */
(function (A) {
  'use strict';

  const TAU0 = 0.01;     // rastro inicial "muy bajo" (artículo, sección 3)
  const TAU_MIN = 1e-12; // suelo numérico: evita que τ^α sea 0 por underflow
  const D_MIN = 1e-9;    // evita divisiones por cero si hay ciudades coincidentes

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  class AntSystem {
    constructor(cities, params, seed) {
      this.cities = cities;
      this.n = cities.length;
      this.params = Object.assign({ algo: 'cycle', m: this.n, alpha: 1, beta: 5, rho: 0.7, Q: 100 }, params);
      this.seed = seed >>> 0;
      this.rand = mulberry32(this.seed);
      const n = this.n;

      this.dist = new Float64Array(n * n);
      this.eta = new Float64Array(n * n);
      this.etaB = new Float64Array(n * n);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const d = Math.hypot(cities[i][0] - cities[j][0], cities[i][1] - cities[j][1]);
          this.dist[i * n + j] = d;
          this.eta[i * n + j] = i === j ? 0 : 1 / Math.max(d, D_MIN);
        }
      }
      this._updateEtaB();

      this.tau = new Float64Array(n * n).fill(TAU0);
      this.delta = new Float64Array(n * n);
      this.w = new Float64Array(n);

      this.ants = [];
      for (let k = 0; k < this.params.m; k++) {
        const s = k % n;
        const visited = new Uint8Array(n); visited[s] = 1;
        this.ants.push({ start: s, cur: s, prev: s, visited: visited, tour: [s], len: 0 });
      }

      this.stepInCycle = 0;
      this.cycle = 0;
      this.best = { len: Infinity, tour: null, cycle: 0 };
      this.lastCycle = { best: NaN, mean: NaN };
      this.history = []; // {cycle, best, cycleBest, cycleMean}
    }

    setParams(p) {
      Object.assign(this.params, p);
      this._updateEtaB();
    }

    _updateEtaB() {
      const b = this.params.beta;
      for (let k = 0; k < this.eta.length; k++) this.etaB[k] = this.eta[k] === 0 ? 0 : Math.pow(this.eta[k], b);
    }

    _add(i, j, v) {
      const n = this.n;
      this.delta[i * n + j] += v;
      this.delta[j * n + i] += v;
    }

    // Regla de transición (2) con ruleta ponderada y lista tabú (ant.visited)
    _choose(ant, i) {
      const n = this.n, tau = this.tau, w = this.w, etaB = this.etaB, alpha = this.params.alpha;
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (ant.visited[j]) { w[j] = 0; continue; }
        const t = Math.max(tau[i * n + j], TAU_MIN);
        w[j] = (alpha === 1 ? t : Math.pow(t, alpha)) * etaB[i * n + j];
        sum += w[j];
      }
      if (!(sum > 0) || !isFinite(sum)) return this._fallback(ant, i); // desbordamiento / underflow
      let r = this.rand() * sum, chosen = -1;
      for (let j = 0; j < n; j++) {
        if (w[j] > 0) { chosen = j; r -= w[j]; if (r <= 0) break; }
      }
      return chosen;
    }

    // Si la ruleta no es utilizable, elegir la ciudad no visitada más cercana (voraz)
    _fallback(ant, i) {
      let best = -1, bd = Infinity;
      for (let j = 0; j < this.n; j++) {
        if (ant.visited[j]) continue;
        const d = this.dist[i * this.n + j];
        if (d < bd) { bd = d; best = j; }
      }
      return best;
    }

    // Un paso: todas las hormigas mueven una ciudad
    step() {
      const n = this.n, p = this.params, algo = p.algo, last = this.stepInCycle === n - 1;
      if (algo !== 'cycle') this.delta.fill(0);

      for (const ant of this.ants) {
        const i = ant.cur;
        const j = last ? ant.start : this._choose(ant, i);
        ant.prev = i; ant.cur = j;
        ant.len += this.dist[i * n + j];
        if (!last) { ant.visited[j] = 1; ant.tour.push(j); }
        if (algo === 'quantity') this._add(i, j, p.Q / Math.max(this.dist[i * n + j], D_MIN));
        else if (algo === 'density') this._add(i, j, p.Q);
      }

      if (algo !== 'cycle') this._updateTau();

      this.stepInCycle++;
      if (this.stepInCycle === n) this._endCycle();
    }

    _updateTau() {
      const rho = this.params.rho, tau = this.tau, d = this.delta;
      for (let k = 0; k < tau.length; k++) {
        const v = rho * tau[k] + d[k];
        tau[k] = v < TAU_MIN ? TAU_MIN : v;
      }
    }

    _endCycle() {
      const n = this.n, algo = this.params.algo;
      let cBest = Infinity, cBestAnt = null, sum = 0;
      for (const ant of this.ants) {
        sum += ant.len;
        if (ant.len < cBest) { cBest = ant.len; cBestAnt = ant; }
      }
      if (algo === 'cycle') {
        this.delta.fill(0);
        for (const ant of this.ants) {
          const dt = this.params.Q / ant.len;
          for (let t = 0; t < n; t++) this._add(ant.tour[t], ant.tour[(t + 1) % n], dt);
        }
        this._updateTau();
      }
      this.cycle++;
      if (cBest < this.best.len - 1e-9) this.best = { len: cBest, tour: cBestAnt.tour.slice(), cycle: this.cycle };
      this.lastCycle = { best: cBest, mean: sum / this.ants.length };
      this.history.push({ cycle: this.cycle, best: this.best.len, cycleBest: cBest, cycleMean: this.lastCycle.mean });

      for (const ant of this.ants) { // vaciar listas tabú
        ant.len = 0; ant.tour = [ant.start];
        ant.visited.fill(0); ant.visited[ant.start] = 1;
      }
      this.stepInCycle = 0;
    }

    runCycles(k) {
      const target = this.cycle + k;
      while (this.cycle < target) this.step();
    }
  }

  A.AntSystem = AntSystem;
  A.TAU0 = TAU0;
})(window.AntApp = window.AntApp || {});
