/* VISTA · Escenario central: ciudades, rastro de feromonas dinámico y hormigas animadas */
(function (A) {
  'use strict';

  const C = {
    edge: [217, 119, 6],   // feromona (--pheromone)
    best: '#0f766e',       // mejor tour (--best)
    ant: '#1f2937',
    city: '#ffffff',
    cityStroke: '#44403c',
    label: '#57534e'
  };

  class StageView {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = { pheromone: true, ants: true, best: true };
      this.cities = null;
      this.w = 0; this.h = 0;
      new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
      this.resize();
    }

    setCities(cities) { this.cities = cities; this._layout(); }

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

    draw(model, progress) {
      const ctx = this.ctx, pts = this.pts, n = pts.length;
      ctx.clearRect(0, 0, this.w, this.h);

      // 1) Rastro de feromonas: grosor y opacidad proporcionales a τ
      if (this.opts.pheromone) {
        const tau = model.tau, t0 = A.TAU0;
        let tmax = 0;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (tau[i * n + j] > tmax) tmax = tau[i * n + j];
        const denom = Math.max(tmax - t0, t0 * 20);
        ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const r = (tau[i * n + j] - t0) / denom;
            if (r < 0.02) continue;
            const q = Math.min(1, r);
            ctx.strokeStyle = 'rgba(' + C.edge.join(',') + ',' + (0.12 + 0.88 * Math.pow(q, 0.7)).toFixed(3) + ')';
            ctx.lineWidth = 0.6 + 7 * q;
            ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke();
          }
        }
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
      ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const rad = n > 30 ? 4 : 6;
      for (let i = 0; i < n; i++) {
        ctx.beginPath(); ctx.arc(pts[i][0], pts[i][1], rad, 0, Math.PI * 2);
        ctx.fillStyle = C.city; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = C.cityStroke; ctx.stroke();
      }

      // 4) Hormigas (interpoladas entre ciudad previa y actual)
      if (this.opts.ants) {
        const e = progress < 0 ? 1 : progress > 1 ? 1 : progress * progress * (3 - 2 * progress);
        for (const a of model.ants) {
          const p0 = pts[a.prev], p1 = pts[a.cur];
          const x = p0[0] + (p1[0] - p0[0]) * e, y = p0[1] + (p1[1] - p0[1]) * e;
          ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2);
          ctx.fillStyle = C.ant; ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke();
        }
      }
    }
  }

  A.StageView = StageView;
})(window.AntApp = window.AntApp || {});
