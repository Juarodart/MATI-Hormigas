/* VISTA · Panel lateral, botones, estadísticas y diálogo de ayuda (sin lógica de negocio) */
(function (A) {
  'use strict';

  const $ = id => document.getElementById(id);

  const HELP_TEXT = [
    'AYUDA · ANT SYSTEM (Colorni, Dorigo y Maniezzo, ECAL91)',
    '',
    'QUÉ SE VE',
    '• Círculos: ciudades. Puntos oscuros: hormigas. Líneas naranjas: rastro de feromona (más gruesas y opacas = más feromona τ).',
    '• Línea verde discontinua: mejor tour encontrado hasta ahora.',
    '• Cada hormiga recorre las n ciudades sin repetir (lista tabú) y vuelve a la inicial: eso es un CICLO (n pasos).',
    '',
    'ALGORITMOS (los tres comparten la regla de transición, cambian en cómo y cuándo se deposita feromona)',
    '• ANT-quantity: en cada paso la hormiga que va de i a j deja Q/dij. Favorece aristas cortas. Actualiza τ en cada paso.',
    '• ANT-density: en cada paso deja una cantidad constante Q, sin importar dij. Actualiza τ en cada paso.',
    '• ANT-cycle: no actualiza paso a paso; al terminar el tour cada hormiga k deja Q/Lk en TODAS las aristas de su recorrido (Lk = longitud total). Los tours cortos refuerzan más.',
    '(Nota: el texto de la sección 4 del artículo describe quantity/density al revés que sus ecuaciones (3) y (4). La app sigue las ecuaciones.)',
    '',
    'PARÁMETROS',
    '• m — número de hormigas. En el artículo se usa 1 hormiga por ciudad; con 4×4 solo con más de 1 por ciudad se alcanza el óptimo en <200 ciclos y más hormigas = más eficiente (salvo en ANT-cycle, donde el coste computacional penaliza un exceso).',
    '• α (alfa) — sensibilidad al rastro. α=0: algoritmo voraz estocástico (ignora feromona). En ANT-cycle lo óptimo es 1 ≤ α ≤ 1,5; con α ≥ 2 converge pronto a tours subóptimos; con α<1 converge lento.',
    '• β (beta) — sensibilidad a la distancia (visibilidad η = 1/d). Es el parámetro MÁS importante: β=0 no converge; β≥1 encuentra el óptimo en pocos ciclos en problemas pequeños. En ANT-cycle, β>5 se atasca en subóptimos.',
    '• ρ (rho) — coeficiente de evaporación del artículo: τ(t+1) = ρ·τ(t) + Δτ. OJO: ρ es la fracción de rastro que PERSISTE (ρ=0,7 → se evapora el 30%). Valor recomendado ≈ 0,7; por debajo de 0,5 o por encima de 0,8 la convergencia es más lenta.',
    '• Q — cantidad de feromona (Q1=Q2=Q3=100 fijado). En el artículo Q no tuvo efecto significativo en ANT-cycle y subir Q equivale a subir α en los otros dos.',
    '',
    'FÓRMULAS',
    '  pij = [τij]^α·[ηij]^β / Σ_(j no visitado) [τij]^α·[ηij]^β',
    '  τij(t+1) = ρ·τij(t) + Δτij',
    '',
    'CONTROLES',
    '• Inicio / Pausa / Reanudar: arrancan, congelan y continúan la simulación. Reiniciar vuelve al estado inicial.',
    '• Cambiar algoritmo, cuadrícula, m o la semilla reinicia la simulación. α, β y ρ se pueden cambiar en vivo mientras corre.',
    '• Al elegir un algoritmo se cargan los parámetros del artículo (Fig. 3: quantity α=2, β=5, ρ=0,7; density α=1, β=5; cycle α=1, β=5).',
    '• Velocidad: el último nivel (Turbo) no anima hormigas y calcula varios ciclos por fotograma.',
    '• Semilla: mismo valor + mismos parámetros = misma ejecución (reproducible).',
    '',
    'PANEL INFERIOR (réplica de la Fig. 3)',
    '• «Ejecución actual»: mejor global, mejor del ciclo y media del ciclo vs. ciclos. La línea roja discontinua es el óptimo conocido (16 en 4×4, 423,74 en Oliver30).',
    '• «Comparar algoritmos»: superpone el mejor global de la última ejecución de cada algoritmo. El botón «Ejecutar los 3» los lanza seguidos (sin animación) con los α, β, ρ, m y ciclos actuales.',
    '',
    'DETALLES DE IMPLEMENTACIÓN',
    '• τ0 = 0,01 (valor muy bajo, como en el artículo). Se usa un suelo numérico de 1e-12 en τ y un respaldo voraz si la ruleta se desborda o da 0.',
    '• La instancia «10 ciudades (tipo CCAO)» usa coordenadas de sustitución, no las originales de Golden & Stewart.'
  ].join('\n');

  class ControlsView {
    constructor() {
      this.el = {
        algoRadios: document.querySelectorAll('input[name="algo"]'),
        instance: $('sel-instance'),
        m: $('rng-m'), alpha: $('rng-alpha'), beta: $('rng-beta'), rho: $('rng-rho'), speed: $('rng-speed'),
        outM: $('out-m'), outAlpha: $('out-alpha'), outBeta: $('out-beta'), outRho: $('out-rho'), outSpeed: $('out-speed'),
        start: $('btn-start'), pause: $('btn-pause'), resume: $('btn-resume'), reset: $('btn-reset'),
        seed: $('inp-seed'), cycles: $('inp-cycles'),
        help: $('btn-help'), dialog: $('help-dialog'), helpText: $('help-text'), helpClose: $('btn-help-close'),
        togPher: $('tog-pheromone'), togAnts: $('tog-ants'), togBest: $('tog-best'),
        modeRun: $('mode-run'), modeCmp: $('mode-compare'), btnCompare: $('btn-compare'), cmpProgress: $('cmp-progress'),
        status: $('status'), hud: $('hud'), legend: $('legend'),
        statCycle: $('st-cycle'), statBest: $('st-best'), statOpt: $('st-opt'), statGap: $('st-gap'),
        statFound: $('st-found'), statLast: $('st-last')
      };
      this.el.helpText.value = HELP_TEXT;
      const panes = { 'tab-fml': $('help-formulas'), 'tab-txt': $('help-text'), 'tab-tex': $('help-tex') };
      $('help-tex').value = A.HelpFormulas.asText();
      const showTab = id => Object.keys(panes).forEach(k => {
        panes[k].hidden = k !== id; $(k).setAttribute('aria-selected', k === id);
      });
      Object.keys(panes).forEach(k => $(k).addEventListener('click', () => showTab(k)));
      this.el.help.addEventListener('click', () => {
        A.HelpFormulas.render($('help-formulas')); // KaTeX carga con defer: se renderiza al abrir
        showTab('tab-fml');
        this.el.dialog.showModal();
      });
      this.el.helpClose.addEventListener('click', () => this.el.dialog.close());
      this.el.dialog.addEventListener('click', e => { if (e.target === this.el.dialog) this.el.dialog.close(); });
    }

    fillInstances(list) {
      this.el.instance.innerHTML = list.map(i => '<option value="' + i.id + '">' + i.name + '</option>').join('');
    }

    setParams(p) {
      const e = this.el;
      if (p.m != null) { e.m.value = p.m; e.outM.textContent = p.m; }
      if (p.alpha != null) { e.alpha.value = p.alpha; e.outAlpha.textContent = (+p.alpha).toFixed(1); }
      if (p.beta != null) { e.beta.value = p.beta; e.outBeta.textContent = (+p.beta).toFixed(1); }
      if (p.rho != null) { e.rho.value = p.rho; e.outRho.textContent = (+p.rho).toFixed(2); }
    }

    setMRange(max) { this.el.m.max = Math.max(max * 2, 8); }

    setSpeedLabel(txt) { this.el.outSpeed.textContent = txt; }

    setAlgo(a) { this.el.algoRadios.forEach(r => { r.checked = r.value === a; }); }

    // idle | running | paused | finished
    setStatus(state, busy) {
      const e = this.el;
      e.start.disabled = busy || state === 'running' || state === 'paused';
      e.pause.disabled = busy || state !== 'running';
      e.resume.disabled = busy || state !== 'paused';
      e.reset.disabled = busy;
      e.btnCompare.disabled = busy;
      const txt = { idle: 'Listo', running: 'En ejecución', paused: 'En pausa', finished: 'Finalizado' }[state];
      e.status.textContent = busy ? 'Comparando…' : txt;
      e.status.dataset.state = busy ? 'running' : state;
    }

    setMode(mode) {
      this.el.modeRun.setAttribute('aria-pressed', mode === 'run');
      this.el.modeCmp.setAttribute('aria-pressed', mode === 'compare');
    }

    setLegend(series) {
      this.el.legend.innerHTML = series.map(s =>
        '<li><span class="sw" style="background:' + s.color + '"></span>' + s.name + '</li>').join('');
    }

    renderStats(model, optimum, maxCycles) {
      const e = this.el, f = v => isFinite(v) ? v.toFixed(2) : '—';
      e.statCycle.textContent = model.cycle + ' / ' + maxCycles;
      e.statBest.textContent = f(model.best.len);
      e.statOpt.textContent = optimum != null ? optimum.toFixed(2) : '—';
      e.statGap.textContent = optimum != null && isFinite(model.best.len)
        ? ((model.best.len / optimum - 1) * 100).toFixed(1) + ' %' : '—';
      e.statFound.textContent = model.best.cycle ? 'ciclo ' + model.best.cycle : '—';
      e.statLast.textContent = isFinite(model.lastCycle.mean) ? f(model.lastCycle.best) + ' / ' + f(model.lastCycle.mean) : '—';
      e.hud.textContent = 'Ciclo ' + model.cycle + ' · paso ' + model.stepInCycle + '/' + model.n;
    }
  }

  A.ControlsView = ControlsView;
})(window.AntApp = window.AntApp || {});
