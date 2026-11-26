/* VISTA · Escenario del experimento del obstáculo (Fig. 1): hormiguero, comida, roca, rastro y hormigas */
(function (A) {
  'use strict';

  class ObstacleView {
    /** Reutiliza el lienzo y el contexto del StageView */
    constructor(stage) {
      this.stage = stage;
      this.clock = 0;
      this.rock = [];
      for (let i = 0; i < 11; i++) { // contorno irregular de la roca (fijo)
        const a = i / 11 * Math.PI * 2, r = 13 + ((i * 37) % 7) * 0.9;
        this.rock.push([Math.cos(a) * r, Math.sin(a) * r * 0.92]);
      }
    }

    _fit(sim) {
      const s = this.stage, ns = Object.values(sim.nodes);
      const minX = -22, maxX = 202;
      const minY = Math.min(...ns.map(n => n.y)) - 24, maxY = Math.max(...ns.map(n => n.y)) + 28;
      const sc = Math.min((s.w - 40) / (maxX - minX), (s.h - 36) / (maxY - minY));
      const ox = (s.w - sc * (maxX - minX)) / 2 - minX * sc, oy = (s.h - sc * (maxY - minY)) / 2 - minY * sc;
      this.sc = sc;
      this.P = (x, y) => [ox + x * sc, oy + y * sc];
    }

    draw(sim, dt, moving) {
      const s = this.stage, ctx = s.ctx, sec = (dt || 0) / 1000;
      if (moving) this.clock += sec;
      this._fit(sim);
      const P = this.P, sc = this.sc;
      ctx.clearRect(0, 0, s.w, s.h);

      // sendero de tierra bajo cada arista
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const e of sim.edges) {
        if (e.blocked) continue;
        const a = P(sim.nodes[e.a].x, sim.nodes[e.a].y), b = P(sim.nodes[e.b].x, sim.nodes[e.b].y);
        ctx.strokeStyle = 'rgba(120,90,50,.08)'; ctx.lineWidth = 11 * sc;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }

      // feromona: grosor y opacidad ∝ τ, con puntos de flujo que avanzan
      if (s.opts.pheromone) {
        let tmax = 0; for (const e of sim.edges) if (!e.blocked && e.tau > tmax) tmax = e.tau;
        const denom = Math.max(tmax, 6);
        const flow = [];
        for (const e of sim.edges) {
          if (e.blocked) continue;
          const q = Math.min(1, e.tau / denom); if (q < 0.015) continue;
          const a = P(sim.nodes[e.a].x, sim.nodes[e.a].y), b = P(sim.nodes[e.b].x, sim.nodes[e.b].y);
          const wd = 2 + 15 * Math.sqrt(q);
          ctx.strokeStyle = 'rgba(217,119,6,' + (0.10 + 0.22 * q).toFixed(3) + ')'; ctx.lineWidth = wd * 2.1; // halo
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          ctx.strokeStyle = 'rgba(217,119,6,' + (0.28 + 0.65 * Math.pow(q, 0.6)).toFixed(3) + ')'; ctx.lineWidth = wd;
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          if (q > 0.12) flow.push([a, b, wd]);
        }
        ctx.setLineDash([3, 10]); ctx.lineDashOffset = -this.clock * 36; ctx.strokeStyle = 'rgba(255,248,235,.85)';
        for (const [a, b, wd] of flow) {
          ctx.lineWidth = Math.max(1, wd * 0.3);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
        ctx.setLineDash([]); ctx.lineDashOffset = 0;
      }

      // obstáculo (o marca donde aparecerá)
      const c = P(90, 0);
      if (sim.blocked) {
        ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(sc * 1.08, sc * 1.08);
        ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(1.5, 4, 17, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); this.rock.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
        const g = ctx.createLinearGradient(-14, -14, 14, 14); g.addColorStop(0, '#a8a29e'); g.addColorStop(1, '#57534e');
        ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#44403c'; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-2, -9); ctx.stroke();
        ctx.restore();
      } else {
        ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(87,83,78,.45)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(c[0], c[1], 15 * sc, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(87,83,78,.7)'; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('aquí irá el obstáculo', c[0], c[1] + 26 * sc);
      }

      // hormiguero y comida
      const nest = P(0, 0), food = P(180, 0);
      ctx.fillStyle = '#6b4423'; ctx.beginPath(); ctx.ellipse(nest[0], nest[1] + 4, 21 * sc, 14 * sc, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#2b1a0c'; ctx.beginPath(); ctx.ellipse(nest[0], nest[1] + 4, 7 * sc, 5 * sc, 0, Math.PI, 0); ctx.fill();
      const crumbs = [[-7, 4], [0, 1], [7, 4], [-3, -4], [4, -3], [11, 0], [-11, 0]];
      crumbs.forEach((p, i) => {
        ctx.fillStyle = i % 2 ? '#65a30d' : '#facc15'; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(food[0] + p[0] * sc, food[1] + p[1] * sc, 4.2 * sc, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = '#57534e'; ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Hormiguero', nest[0], nest[1] + 24 * sc + 8); ctx.fillText('Comida', food[0], food[1] + 24 * sc + 8);

      // etiquetas de los rodeos
      const lu = sim.byId.J1U.len + sim.byId.UJ2.len, ll = sim.byId.J1L.len + sim.byId.LJ2.len;
      ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = '#78716c';
      const tu = P(90, sim.nodes.U.y), tl = P(90, sim.nodes.L.y);
      ctx.fillText('rodeo corto · ' + Math.round(lu) + ' u', tu[0], tu[1] - 10);
      ctx.fillText('rodeo largo · ' + Math.round(ll) + ' u (×' + (ll / lu).toFixed(1) + ')', tl[0], tl[1] + 26);

      // hormigas
      if (s.opts.ants) {
        const size = Math.max(0.95, Math.min(1.7, sc * 0.2));
        for (const a of sim.ants) {
          const n0 = sim.nodes[a.from], n1 = sim.nodes[a.to];
          let dx = n1.x - n0.x, dy = n1.y - n0.y; const L = Math.hypot(dx, dy) || 1;
          const nx = -dy / L, ny = dx / L;
          const p = P(n0.x + dx * a.s + nx * a.off, n0.y + dy * a.s + ny * a.off);
          A.AntSprite.draw(ctx, p[0], p[1], Math.atan2(dy, dx), size, a.phase, a.mode === 'back');
        }
      }
    }
  }

  A.ObstacleView = ObstacleView;
})(window.AntApp = window.AntApp || {});
