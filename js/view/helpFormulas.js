/* VISTA · Fórmulas de la ayuda en LaTeX (se renderizan con KaTeX; sin conexión se muestra el código LaTeX) */
(function (A) {
  'use strict';

  const FORMULAS = [
    { id: 'tsp', title: 'Problema (TSP euclídeo)',
      tex: ['d_{ij}=\\sqrt{(x_i-x_j)^2+(y_i-y_j)^2}',
            'L(\\pi)=\\sum_{s=1}^{n} d_{\\pi_s,\\pi_{s+1}},\\quad \\pi_{n+1}:=\\pi_1,\\qquad \\pi^*=\\arg\\min_{\\pi} L(\\pi)'],
      note: 'n ciudades; un tour π es una permutación cíclica de las ciudades.' },
    { id: 'eta', title: 'Visibilidad',
      tex: ['\\eta_{ij}=\\dfrac{1}{d_{ij}}'],
      note: 'Información heurística, fija: las ciudades cercanas son más atractivas.' },
    { id: 'p', title: 'Regla de transición (ec. 2)',
      tex: ['p_{ij}^{k}(t)=\\begin{cases}\\dfrac{[\\tau_{ij}(t)]^{\\alpha}\\,[\\eta_{ij}]^{\\beta}}{\\sum_{l\\in J_i^k(t)}[\\tau_{il}(t)]^{\\alpha}\\,[\\eta_{il}]^{\\beta}} & j\\in J_i^k(t)\\\\[2ex] 0 & j\\notin J_i^k(t)\\end{cases}'],
      note: 'J_i^k(t) = ciudades aún no visitadas por la hormiga k (complemento de su lista tabú). α pondera el rastro τ y β la visibilidad η.' },
    { id: 'tau', title: 'Actualización de la feromona (ec. 1)',
      tex: ['\\tau_{ij}(t+1)=\\rho\\,\\tau_{ij}(t)+\\Delta\\tau_{ij}(t,t+1),\\qquad \\Delta\\tau_{ij}=\\sum_{k=1}^{m}\\Delta\\tau_{ij}^{k}'],
      note: 'ρ ∈ (0,1) es la fracción de rastro que persiste (se evapora 1−ρ). m = número de hormigas. Rastro inicial τ_ij(0)=τ₀ muy pequeño.' },
    { id: 'quantity', title: 'ANT-quantity (ec. 3) · actualiza en cada paso',
      tex: ['\\Delta\\tau_{ij}^{k}(t,t+1)=\\begin{cases}\\dfrac{Q_1}{d_{ij}} & \\text{si la hormiga } k \\text{ va de } i \\text{ a } j\\\\[1.5ex] 0 & \\text{en otro caso}\\end{cases}'],
      note: 'El depósito es inversamente proporcional a la distancia: las aristas cortas se refuerzan más.' },
    { id: 'density', title: 'ANT-density (ec. 4) · actualiza en cada paso',
      tex: ['\\Delta\\tau_{ij}^{k}(t,t+1)=\\begin{cases}Q_2 & \\text{si la hormiga } k \\text{ va de } i \\text{ a } j\\\\[0.5ex] 0 & \\text{en otro caso}\\end{cases}'],
      note: 'Cantidad constante: el depósito no depende de dᵢⱼ, solo cuenta cuántas hormigas pasan.' },
    { id: 'cycle', title: 'ANT-cycle (ec. 5 y 1′) · actualiza al cerrar el ciclo (cada n pasos)',
      tex: ['\\Delta\\tau_{ij}^{k}(t,t+n)=\\begin{cases}\\dfrac{Q_3}{L_k} & \\text{si } (i,j) \\text{ pertenece al tour de la hormiga } k\\\\[1.5ex] 0 & \\text{en otro caso}\\end{cases}',
            '\\tau_{ij}(t+n)=\\rho\\,\\tau_{ij}(t)+\\sum_{k=1}^{m}\\Delta\\tau_{ij}^{k}(t,t+n)'],
      note: 'L_k = longitud del tour completo de la hormiga k. Los tours cortos refuerzan todas sus aristas más.' },
    { id: 'diff', title: 'Diferencia quantity vs. density',
      tex: ['\\text{quantity: } \\Delta\\tau_{ij}^k=\\dfrac{Q_1}{d_{ij}}\\qquad\\text{density: } \\Delta\\tau_{ij}^k=Q_2'],
      note: 'Solo cambia el depósito. En quantity la feromona crece a la vez que la visibilidad (τ ∝ 1/d, igual que η), con lo que se refuerza dos veces el sesgo hacia aristas cortas; por eso es algo más propenso a mínimos locales. En density el rastro solo mide tráfico.' }
  ];

  function renderInto(container) {
    container.innerHTML = '';
    FORMULAS.forEach(function (f) {
      const sec = document.createElement('section');
      sec.className = 'fml';
      const h = document.createElement('h3'); h.textContent = f.title; sec.appendChild(h);
      f.tex.forEach(function (t) {
        const d = document.createElement('div'); d.className = 'fml-tex';
        if (window.katex) {
          try { window.katex.render(t, d, { displayMode: true, throwOnError: false }); }
          catch (e) { d.textContent = t; }
        } else { d.textContent = t; d.classList.add('raw'); }
        sec.appendChild(d);
      });
      const p = document.createElement('p'); p.textContent = f.note; sec.appendChild(p);
      container.appendChild(sec);
    });
  }

  // Código LaTeX en texto plano, para copiarlo a la memoria
  function asText() {
    return FORMULAS.map(function (f) {
      return '% ' + f.title + '\n' + f.tex.map(function (t) { return '\\[ ' + t + ' \\]'; }).join('\n') + '\n% ' + f.note;
    }).join('\n\n');
  }

  A.HelpFormulas = { render: renderInto, asText: asText };
})(window.AntApp = window.AntApp || {});
