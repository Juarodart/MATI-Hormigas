/* VISTA · Escenario central del TSP: ciudades, rastro de feromonas con flujo animado y hormigas */
(function (A) {
  'use strict';

  const C = {
    edge: [217, 119, 6],   // feromona (--pheromone)
    best: '#0f766e',       // mejor tour
    city: '#ffffff',
    cityStroke: '#44403c'
  };

  class StageView {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = { pheromone: true, ants: true, best: true };
      this.cities = null;
      this.w = 0; this.h = 0;
      this.clock = 0;   // segundos de animación (solo avanza si algo se mueve)
      this.pulse = 0;   // destello al depositar feromona (ANT-cycle)
      this._cyc = 0;
      new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
      this.resize();
    }

    setCities(cities) { this.cities = cities; this._layout(); this.pulse = 0; this._cyc = 0; }

    resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.w = Math.max(200, r.width); this.h = Math.max(160, r.height);
      this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
      this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._layout();
      this.dirty = true;
    }

    _layout() {
      if (!this.cities) return;
      const xs = this.cities.map(c => c[0]), ys = this.cities.map(c => c[1]);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const pad = 44;
      const sx = (this.w - 2 * pad) / Math.max(maxX - minX, 1e-9);
      const sy = (this.h - 2 * pad) / Math.max(maxY - minY, 1e-9);
      const s = Math.min(sx, sy);
      const ox = (this.w - s * (maxX - minX)) / 2, oy = (this.h - s * (maxY - minY)) / 2;
      this.pts = this.cities.map(c => [ox + (c[0] - minX) * s, this.h - (oy + (c[1] - minY) * s)]);
    }

    /**
     * @param model    AntSystem
     * @param progress 0..1 avance de las hormigas entre ciudades
     * @param dt       ms desde el fotograma anterior
     * @param moving   true si la animación está en marcha (hormigas caminando / feromona fluyendo)
     */
    draw(model, progress, dt, moving) {
      const ctx = this.ctx, pts = this.pts, n = pts.length, sec = (dt || 0) / 1000;
      if (moving) this.clock += sec;
      this.pulse = Math.max(0, this.pulse - sec * 1.4);
      if (model.cycle !== this._cyc) {
        if (moving && model.params.algo === 'cycle' && model.cycle > this._cyc) this.pulse = 1;
        this._cyc = model.cycle;
      }
      ctx.clearRect(0, 0, this.w, this.h);

      // 1) Rastro de feromonas: grosor y opacidad ∝ τ, con puntos de flujo que avanzan por las aristas
      if (this.opts.pheromone) {
        const tau = model.tau, t0 = A.TAU0;
        let tmax = 0;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (tau[i * n + j] > tmax) tmax = tau[i * n + j];
        const denom = Math.max(tmax - t0, t0 * 20);
        ctx.lineCap = 'round';
        const strong = [];
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const r = (tau[i * n + j] - t0) / denom;
            if (r < 0.02) continue;
            const q = Math.min(1, r), wd = 0.6 + 7 * q + this.pulse * 3.5 * q;
            const al = Math.min(1, 0.12 + 0.88 * Math.pow(q, 0.7) + this.pulse * 0.25 * q);
            ctx.strokeStyle = 'rgba(' + C.edge.join(',') + ',' + al.toFixed(3) + ')';
            ctx.lineWidth = wd;
            ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke();
            if (q > 0.22) strong.push([i, j, wd]);
          }
        }
        // flujo: guiones claros que se desplazan sobre las aristas con más feromona
        ctx.setLineDash([3, 9]); ctx.lineDashOffset = -this.clock * 34;
        ctx.strokeStyle = 'rgba(255,248,235,.8)';
        for (const [i, j, wd] of strong) {
          ctx.lineWidth = Math.max(1, wd * 0.32);
          ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke();
        }
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
      }

      // 2) Mejor tour encontrado
      if (this.opts.best && model.best.tour) {
        const t = model.best.tour;
        ctx.strokeStyle = C.best; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
        ctx.beginPath();
        for (let k = 0; k <= t.length; k++) {
          const p = pts[t[k % t.length]];
          k === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }

      // 3) Ciudades
      const rad = n > 30 ? 4 : 6;
      for (let i = 0; i < n; i++) {
        ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], rad, 0, Math.PI * 2);
        ctx.fillStyle = C.city; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = C.cityStroke; ctx.stroke();
      }

      // 4) Hormigas: sprites orientados hacia donde caminan, con patas animadas
      if (this.opts.ants) {
        const e = progress < 0 ? 1 : progress > 1 ? 1 : progress * progress * (3 - 2 * progress);
        const size = n > 30 ? 0.85 : 1.05;
        for (const a of model.ants) {
          const p0 = pts[a.prev], p1 = pts[a.cur];
          const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
          if (dx * dx + dy * dy > 1) a._ang = Math.atan2(dy, dx);
          const x = p0[0] + dx * e, y = p0[1] + dy * e;
          A.AntSprite.draw(ctx, x, y, a._ang || 0, size, this.clock * 16 + a.start * 1.7, false);
        }
      }
    }
  }

  A.StageView = StageView;
})(window.AntApp = window.AntApp || {});
