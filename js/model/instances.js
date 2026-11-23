/* MODELO · Instancias del problema (conjuntos de ciudades) */
(function (A) {
  'use strict';

  // 30 ciudades del artículo (Oliver30, Whitley et al. 1989). Óptimo: 423.741 (420 con distancias enteras).
  const OLIVER30 = [
    [54, 67], [54, 62], [37, 84], [41, 94], [2, 99], [7, 64], [25, 62], [22, 60], [18, 54], [4, 50],
    [13, 40], [18, 40], [24, 42], [25, 38], [41, 26], [44, 35], [45, 21], [58, 35], [62, 32], [82, 7],
    [91, 38], [83, 46], [71, 44], [64, 60], [68, 58], [83, 69], [87, 76], [74, 78], [71, 71], [58, 69]
  ];

  // 10 ciudades "estilo CCAO". OJO: coordenadas de sustitución, NO son las originales de Golden & Stewart.
  // Para replicar el CCAO exacto basta con reemplazar este array por las coordenadas del libro.
  const CCAO_LIKE = [
    [0.5, 4.2], [1.6, 5.4], [3.0, 5.0], [4.3, 5.6], [5.4, 4.2],
    [5.0, 2.6], [3.8, 1.2], [2.4, 0.8], [1.2, 1.9], [2.9, 3.1]
  ];

  function grid(side) {
    const pts = [];
    for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) pts.push([x, y]);
    return pts;
  }

  // PRNG determinista (mulberry32) para el problema aleatorio reproducible
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function randomCities(n, seed) {
    const r = mulberry32(seed), pts = [];
    for (let i = 0; i < n; i++) pts.push([Math.round(r() * 100), Math.round(r() * 100)]);
    return pts;
  }

  // Óptimo exacto (Held-Karp) para n <= 12
  function heldKarp(cities) {
    const n = cities.length;
    const d = (i, j) => Math.hypot(cities[i][0] - cities[j][0], cities[i][1] - cities[j][1]);
    const N = 1 << (n - 1), INF = Infinity;
    const dp = new Float64Array(N * (n - 1)).fill(INF);
    for (let j = 1; j < n; j++) dp[(1 << (j - 1)) * (n - 1) + (j - 1)] = d(0, j);
    for (let mask = 1; mask < N; mask++) {
      for (let j = 1; j < n; j++) {
        if (!(mask & (1 << (j - 1)))) continue;
        const cur = dp[mask * (n - 1) + (j - 1)];
        if (cur === INF) continue;
        for (let k = 1; k < n; k++) {
          if (mask & (1 << (k - 1))) continue;
          const nm = mask | (1 << (k - 1)), idx = nm * (n - 1) + (k - 1);
          const v = cur + d(j, k);
          if (v < dp[idx]) dp[idx] = v;
        }
      }
    }
    let best = INF;
    for (let j = 1; j < n; j++) best = Math.min(best, dp[(N - 1) * (n - 1) + (j - 1)] + d(j, 0));
    return best;
  }

  const LIST = [
    { id: 'grid4', name: 'Cuadrícula 4×4 (16 ciudades)', cities: grid(4), optimum: 16 },
    { id: 'grid5', name: 'Cuadrícula 5×5 (25 ciudades)', cities: grid(5), optimum: 24 + Math.SQRT2 },
    { id: 'grid6', name: 'Cuadrícula 6×6 (36 ciudades)', cities: grid(6), optimum: 36 },
    { id: 'ccao', name: '10 ciudades (tipo CCAO)', cities: CCAO_LIKE, optimum: null },
    { id: 'oliver30', name: '30 ciudades (Oliver30, Fig. 3)', cities: OLIVER30, optimum: 423.741 },
    { id: 'rand12', name: 'Aleatorio (12 ciudades)', cities: randomCities(12, 7), optimum: null },
    { id: 'rand40', name: 'Aleatorio (40 ciudades)', cities: randomCities(40, 11), optimum: null }
  ];
  LIST.forEach(function (it) {
    if (it.optimum == null && it.cities.length <= 12) it.optimum = heldKarp(it.cities);
  });

  A.Instances = {
    list: LIST,
    get: function (id) { return LIST.find(function (i) { return i.id === id; }) || LIST[0]; }
  };
})(window.AntApp = window.AntApp || {});
