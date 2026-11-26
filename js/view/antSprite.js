/* VISTA · Sprite de hormiga dibujado con canvas (cabeza, tórax, abdomen, antenas y 6 patas que andan) */
(function (A) {
  'use strict';

  const BODY = '#2b2118';

  /**
   * @param ctx    contexto 2D
   * @param x,y    posición del centro (px)
   * @param ang    dirección de avance (rad)
   * @param size   escala (1 = ~11 px de largo)
   * @param phase  fase del paso de las patas (rad)
   * @param carry  true si lleva una miga de comida a cuestas
   */
  function draw(ctx, x, y, ang, size, phase, carry) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(size, size);
    ctx.lineCap = 'round';

    // patas: 3 pares; cada pata se mueve en oposición a la del lado contrario (marcha trípode)
    ctx.strokeStyle = BODY; ctx.lineWidth = 0.75;
    for (let i = 0; i < 3; i++) {
      const bx = (i - 1) * 1.7, sw = Math.sin(phase + i * 2.1) * 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, 0); ctx.lineTo(bx + sw, 4.4);
      ctx.moveTo(bx, 0); ctx.lineTo(bx - sw, -4.4);
      ctx.stroke();
    }
    // antenas
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(4.9, 0.7); ctx.lineTo(7.4, 2.5);
    ctx.moveTo(4.9, -0.7); ctx.lineTo(7.4, -2.5);
    ctx.stroke();

    // cuerpo
    ctx.fillStyle = BODY;
    ctx.beginPath(); ctx.ellipse(-3.9, 0, 3.4, 2.4, 0, 0, Math.PI * 2); ctx.fill(); // abdomen
    ctx.beginPath(); ctx.ellipse(0, 0, 2.0, 1.4, 0, 0, Math.PI * 2); ctx.fill();     // tórax
    ctx.beginPath(); ctx.arc(3.5, 0, 1.7, 0, Math.PI * 2); ctx.fill();               // cabeza

    // brillo
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.ellipse(-4.3, -0.8, 1.7, 0.7, 0, 0, Math.PI * 2); ctx.fill();

    if (carry) { // miga de comida
      ctx.fillStyle = '#84cc16'; ctx.strokeStyle = '#4d7c0f'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(-1.2, 0, 1.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  A.AntSprite = { draw: draw };
})(window.AntApp = window.AntApp || {});
