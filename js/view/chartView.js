/* VISTA · Panel inferior: gráfica "longitud del tour vs. ciclos" (réplica de la Fig. 3 del artículo)
 * Modo "run": mejor global, mejor del ciclo y media del ciclo de la ejecución actual.
 * Modo "compare": mejor global de la última ejecución de cada algoritmo, superpuestas.
 */
(function (A) {
  'use strict';

  const COL = {
    quantity: '#d97706', density: '#2563eb', cycle: '#0f766e',
    best: '#0f766e', cycleBest: '#d97706', mean: '#a8a29e',
    axis: '#78716c', grid: 'rgba(120,113,108,.18)', opt: '#b91c1c', text: '#44403c'
  };
  const NAMES = { quantity: 'ANT-quantity', density: 'ANT-density', cycle: 'ANT-cycle' };

  class ChartView {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
      this.resize();
    }

    resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.w = Math.max(240, r.width); this.h = Math.max(140, r.height);
      this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
      this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.dirty = true;
    }

    // series: [{name,color,width,dash,data:[y...]}]  (x = índice+1 = ciclo); los valores null cortan la línea
    // opts: {xLabel, yLabel, xScale (unidades por muestra), yMin, yMax, refLabel, emptyText}
    draw(series, optimum, maxCycles, opts) {
      opts = opts || {};
      const ctx = this.ctx, w = this.w, h = this.h;
      const L = 56, R = 14, T = 12, B = 28;
      ctx.clearRect(0, 0, w, h);

      let maxX = 10, minY = Infinity, maxY = -Infinity;
      for (const s of series) {
        maxX = Math.max(maxX, s.data.length);
        for (const v of s.data) { if (v == null) continue; if (v < minY) minY = v; if (v > maxY) maxY = v; }
      }
      maxX = Math.max(maxX, Math.min(maxCycles, 50));
      if (optimum != null) { minY = Math.min(minY, optimum); maxY = Math.max(maxY, optimum); }
      if (!isFinite(minY)) { minY = 0; maxY = 1; }
      const padY = (maxY - minY) * 0.06 || 1;
      minY -= padY; maxY += padY;
      if (opts.yMin != null) minY = opts.yMin;
      if (opts.yMax != null) maxY = opts.yMax;

      const X = x => L + (x - 1) / Math.max(maxX - 1, 1) * (w - L - R);
      const Y = y => T + (1 - (y - minY) / (maxY - minY)) * (h - T - B);

      // rejilla y ejes
      ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = COL.axis; ctx.strokeStyle = COL.grid; ctx.lineWidth = 1;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let k = 0; k <= 4; k++) {
        const v = minY + (maxY - minY) * k / 4, y = Y(v);
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(w - R, y); ctx.stroke();
        ctx.fillText(v.toFixed(v < 100 ? 1 : 0), L - 6, y);
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let k = 0; k <= 5; k++) {
        const x = 1 + (maxX - 1) * k / 5;
        ctx.fillText(Math.round((x - (opts.xScale ? 1 : 0)) * (opts.xScale || 1)), X(x), h - B + 6);
      }
      ctx.save(); ctx.translate(12, (T + h - B) / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(opts.yLabel || 'Longitud del tour', 0, 0); ctx.restore();
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(opts.xLabel || 'Ciclos', (L + w - R) / 2, h - 1);

      // óptimo / referencia
      if (optimum != null) {
        ctx.strokeStyle = COL.opt; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(L, Y(optimum)); ctx.lineTo(w - R, Y(optimum)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = COL.opt; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(opts.refLabel || ('óptimo ' + optimum.toFixed(optimum < 100 ? 2 : 1)), L + 6, Y(optimum) - 2);
      }

      // series
      for (const s of series) {
        if (!s.data.length) continue;
        ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 1.6; ctx.lineJoin = 'round';
        ctx.setLineDash(s.dash || []);
        ctx.beginPath();
        let pen = false;
        s.data.forEach((v, i) => { if (v == null) { pen = false; return; } const x = X(i + 1), y = Y(v); pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; });
        ctx.stroke(); ctx.setLineDash([]);
      }
      if (!series.some(s => s.data.some(v => v != null))) {
        ctx.fillStyle = COL.axis; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText(opts.emptyText || 'Pulsa «Inicio» para ver la evolución', (L + w - R) / 2, (T + h - B) / 2);
      }
    }

    static runSeries(history) {
      return [
        { name: 'Media del ciclo', color: COL.mean, width: 1, data: history.map(h => h.cycleMean) },
        { name: 'Mejor del ciclo', color: COL.cycleBest, width: 1, data: history.map(h => h.cycleBest) },
        { name: 'Mejor global', color: COL.best, width: 2.4, data: history.map(h => h.best) }
      ];
    }

    static compareSeries(runs) {
      return ['quantity', 'density', 'cycle'].map(a => ({
        name: NAMES[a], color: COL[a], width: 2.2, data: (runs[a] || []).map(h => h.best)
      }));
    }
  }

  ChartView.COL = COL; ChartView.NAMES = NAMES;
  A.ChartView = ChartView;
})(window.AntApp = window.AntApp || {});
