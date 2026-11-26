/* CONTROLADOR · Une modelo y vistas, gestiona el bucle de animación y los eventos de usuario */
(function (A) {
  'use strict';

  // Parámetros por defecto por algoritmo tomados del artículo (Fig. 3, 4, 6 y 7)
  const PRESETS = {
    quantity: { alpha: 2, beta: 5, rho: 0.7, Q: 100 },
    density:  { alpha: 1, beta: 5, rho: 0.7, Q: 100 },
    cycle:    { alpha: 1, beta: 5, rho: 0.7, Q: 100 }
  };
  // Valores por defecto del experimento del obstáculo (α = 2 y ρ por segundo)
  const OBS_DEFAULT = { m: 30, alpha: 2, rho: 0.97, ratio: 1.8 };
  // Duración (ms) de un paso por nivel de velocidad; 0 = turbo (sin animar hormigas)
  const SPEEDS = [{ ms: 500, label: 'Muy lenta' }, { ms: 220, label: 'Lenta' }, { ms: 90, label: 'Media' },
                  { ms: 30, label: 'Rápida' }, { ms: 0, label: 'Turbo' }];
  // Ritmo de la simulación continua del obstáculo por nivel de velocidad (1 = tiempo real)
  const TIMESCALES = [0.4, 1, 2, 4, 8];

  class AppController {
    constructor() {
      this.v = new A.ControlsView();
      this.stage = new A.StageView(document.getElementById('stage-canvas'));
      this.obstacleView = new A.ObstacleView(this.stage);
      this.chart = new A.ChartView(document.getElementById('chart-canvas'));

      this.exp = 'tsp';          // tsp | obstacle
      this.state = 'idle';       // idle | running | paused | finished
      this.busy = false;         // comparación en curso
      this.algo = 'quantity';
      this.instance = A.Instances.list.find(i => i.id === 'grid4') || A.Instances.list[0];
      this.params = Object.assign({ m: this.instance.cities.length }, PRESETS[this.algo]);
      this.obsParams = Object.assign({}, OBS_DEFAULT);
      this.maxCycles = 500;
      this.speedIdx = 2;
      this.mode = 'run';
      this.runs = {};            // última ejecución (historial) de cada algoritmo, por instancia
      this.acc = 0; this.progress = 1; this.last = 0; this.dt = 0;

      this.v.fillInstances(A.Instances.list);
      this.v.el.instance.value = this.instance.id;
      this.v.setAlgo(this.algo);
      this.v.setParams(this.params);
      this.v.setMRange(this.instance.cities.length);
      this.v.setSpeedLabel(SPEEDS[this.speedIdx].label);
      this.v.el.speed.value = this.speedIdx;
      this._bind();
      this.reset();
      requestAnimationFrame(t => this._tick(t));
    }

    get cur() { return this.exp === 'tsp' ? this.params : this.obsParams; }

    // ---------- Modelo ----------
    _seed() { return Math.max(0, parseInt(this.v.el.seed.value, 10) || 0); }

    reset() {
      if (this.exp === 'tsp') {
        const p = Object.assign({}, this.params, { algo: this.algo });
        this.model = new A.AntSystem(this.instance.cities, p, this._seed());
        this.stage.setCities(this.instance.cities);
      } else {
        this.obs = new A.ObstacleSim(Object.assign({}, this.obsParams, { algo: this.algo }), this._seed());
        this.v.setObstacleButton(false);
      }
      this.state = 'idle';
      this.acc = 0; this.progress = 1;
      this.v.setStatus(this.state, this.busy);
      this._refresh(true);
    }

    _setExp(exp) {
      this.exp = exp;
      this.v.setExp(exp);
      if (exp === 'obstacle') {
        this.v.setParams({ m: this.obsParams.m, alpha: this.obsParams.alpha, rho: this.obsParams.rho });
        this.v.setRatio(this.obsParams.ratio);
      } else {
        this.v.setParams(this.params);
        this.v.setMRange(this.instance.cities.length);
      }
      this.reset();
    }

    // ---------- Eventos ----------
    _bind() {
      const e = this.v.el;
      e.expRadios.forEach(r => r.addEventListener('change', () => this._setExp(r.value)));
      e.algoRadios.forEach(r => r.addEventListener('change', () => {
        this.algo = r.value;
        if (this.exp === 'tsp') {
          const keepM = this.params.m;
          this.params = Object.assign({ m: keepM }, PRESETS[this.algo]);
          this.v.setParams(this.params);
        }
        this.reset();
      }));
      e.instance.addEventListener('change', () => {
        this.instance = A.Instances.get(e.instance.value);
        this.params.m = this.instance.cities.length;
        this.runs = {};
        this.v.setMRange(this.params.m);
        this.v.setParams({ m: this.params.m });
        this.reset();
      });
      e.m.addEventListener('input', () => { this.cur.m = +e.m.value; this.v.setParams({ m: this.cur.m }); this.reset(); });
      ['alpha', 'beta', 'rho'].forEach(k => e[k].addEventListener('input', () => {
        if (this.exp === 'obstacle' && k === 'beta') return;
        this.cur[k] = +e[k].value;
        this.v.setParams({ [k]: this.cur[k] });
        (this.exp === 'tsp' ? this.model : this.obs).setParams({ [k]: this.cur[k] }); // se aplica en vivo
      }));
      e.speed.addEventListener('input', () => {
        this.speedIdx = +e.speed.value; this.v.setSpeedLabel(SPEEDS[this.speedIdx].label); this.acc = 0;
      });
      e.seed.addEventListener('change', () => this.reset());
      e.cycles.addEventListener('change', () => {
        this.maxCycles = Math.min(5000, Math.max(10, parseInt(e.cycles.value, 10) || 500));
        e.cycles.value = this.maxCycles; this._refresh(true);
      });

      e.btnObstacle.addEventListener('click', () => {
        this.obs.setBlocked(!this.obs.blocked); this.v.setObstacleButton(this.obs.blocked);
      });
      e.ratio.addEventListener('input', () => {
        this.obsParams.ratio = +e.ratio.value; this.v.setRatio(this.obsParams.ratio);
        this.obs.setParams({ ratio: this.obsParams.ratio });
      });

      e.start.addEventListener('click', () => {
        if (this.exp === 'tsp' ? (this.state === 'finished' || this.model.cycle > 0) : this.obs.t > 0) this.reset();
        this.state = 'running'; this._status();
      });
      e.pause.addEventListener('click', () => { this.state = 'paused'; this._status(); });
      e.resume.addEventListener('click', () => { this.state = 'running'; this._status(); });
      e.reset.addEventListener('click', () => this.reset());

      e.togPher.addEventListener('change', () => { this.stage.opts.pheromone = e.togPher.checked; this._refresh(); });
      e.togAnts.addEventListener('change', () => { this.stage.opts.ants = e.togAnts.checked; this._refresh(); });
      e.togBest.addEventListener('change', () => { this.stage.opts.best = e.togBest.checked; this._refresh(); });

      e.modeRun.addEventListener('click', () => this._setMode('run'));
      e.modeCmp.addEventListener('click', () => this._setMode('compare'));
      e.btnCompare.addEventListener('click', () => this.compareAll());
      this.v.setMode(this.mode);
    }

    _status() { this.v.setStatus(this.state, this.busy); }
    _setMode(m) { this.mode = m; this.v.setMode(m); this._refresh(true); }

    // ---------- Bucle de animación ----------
    _tick(ts) {
      requestAnimationFrame(t => this._tick(t));
      const dt = Math.min(ts - (this.last || ts), 100); this.last = ts; this.dt = dt;
      if (this.state === 'running' && !this.busy) {
        if (this.exp === 'tsp') this._advance(dt);
        else this.obs.update(dt / 1000 * TIMESCALES[this.speedIdx]);
      }
      this._refresh(false);
    }

    _advance(dt) {
      const sd = SPEEDS[this.speedIdx].ms, m = this.model;
      if (sd === 0) {
        const t0 = performance.now();
        while (performance.now() - t0 < 12 && m.cycle < this.maxCycles) m.step();
        this.progress = 1;
      } else {
        this.acc += dt;
        let guard = 0;
        while (this.acc >= sd && guard++ < 25 && m.cycle < this.maxCycles) { this.acc -= sd; m.step(); }
        if (this.acc > sd) this.acc = sd;
        this.progress = this.acc / sd;
      }
      this.runs[this.algo] = m.history;
      if (m.cycle >= this.maxCycles) { this.state = 'finished'; this.progress = 1; this._status(); }
    }

    _refresh(force) {
      const moving = this.state === 'running' && !this.busy && (this.exp === 'obstacle' || SPEEDS[this.speedIdx].ms > 0);
      if (this.exp === 'tsp') {
        const m = this.model, len = m.history.length;
        this.stage.draw(m, this.progress, this.dt, moving);
        this.v.renderStats(m, this.instance.optimum, this.maxCycles);
        const sig = 't' + this.mode + len + '|' + Object.keys(this.runs).map(k => (this.runs[k] || []).length).join(',');
        if (force || sig !== this._sig || this.chart.dirty) {
          this._sig = sig; this.chart.dirty = false;
          const series = this.mode === 'run' ? A.ChartView.runSeries(m.history) : A.ChartView.compareSeries(this.runs);
          this.chart.draw(series, this.instance.optimum, this.maxCycles);
          this.v.setLegend(series);
        }
      } else {
        const o = this.obs;
        this.obstacleView.draw(o, this.dt, moving);
        this.v.renderObstacleStats(o.stats());
        const sig = 'o' + o.hist.short.length + (o.blocked ? 'b' : 'f');
        if (force || sig !== this._sig || this.chart.dirty) {
          this._sig = sig; this.chart.dirty = false;
          const series = [
            { name: '% que elige el rodeo corto (últimas 30)', color: '#0f766e', width: 2.4, data: o.hist.short },
            { name: '% de feromona en el rodeo corto', color: '#d97706', width: 1.6, data: o.hist.pher }
          ];
          this.chart.draw(series, 50, 0, { xLabel: 'Tiempo (s)', yLabel: '%', xScale: 0.5, yMin: 0, yMax: 100,
            refLabel: 'sin preferencia (50 %)', emptyText: 'Coloca el obstáculo para ver qué rodeo elige la colonia' });
          this.v.setLegend(series);
        }
      }
    }

    // ---------- Comparación de los tres algoritmos (sin animación, por tandas) ----------
    async compareAll() {
      if (this.busy) return;
      this.busy = true; this.state = this.state === 'running' ? 'paused' : this.state; this._status();
      const prog = this.v.el.cmpProgress; prog.hidden = false;
      const algos = ['quantity', 'density', 'cycle'], N = this.maxCycles;
      for (let a = 0; a < algos.length; a++) {
        const p = Object.assign({}, this.params, { algo: algos[a] });
        const sys = new A.AntSystem(this.instance.cities, p, this._seed());
        while (sys.cycle < N) {
          sys.runCycles(Math.min(5, N - sys.cycle));
          prog.value = (a + sys.cycle / N) / algos.length;
          this.runs[algos[a]] = sys.history;
          if (sys.cycle % 25 === 0) await new Promise(r => setTimeout(r, 0));
        }
        this.runs[algos[a]] = sys.history;
      }
      prog.hidden = true; this.busy = false; this._status();
      this._setMode('compare');
    }
  }

  A.AppController = AppController;
})(window.AntApp = window.AntApp || {});
