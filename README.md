# MATI-Hormigas

Trabajo sobre el artículo:

> Colorni, A., Dorigo, M. y Maniezzo, V. (1992). *Distributed Optimization by Ant Colonies*.
> Proceedings of the First European Conference on Artificial Life, París, F. Varela y P. Bourgine (eds.),
> Elsevier Publishing, pp. 134–142.

**Equipo:** _[nombres]_ · **Asignatura:** _[asignatura]_ · **Curso:** _[curso]_

## Estructura del repositorio

```
MATI-Hormigas/
├── README.md                  ← esta portada
├── index.html                 ← aplicación web interactiva (ver sección siguiente)
├── css/  js/                  ← estilos y código de la app (MVC)
├── ACO_Ant_System_SageMath.ipynb ← implementación en SageMath
├── docs/
│   ├── guion.md               ← guion de la exposición, reparto y preguntas
│   ├── bibliografia.md        ← referencias (rúbrica: Bibliografía)
│   ├── informe/               ← documento escrito (rúbrica: Documentación)  [pendiente]
│   └── diapositivas/          ← presentación (rúbrica: Exposición)           [pendiente]
└── .gitignore
```

## Aplicación interactiva

Simulación en el navegador del Ant System del artículo aplicado al TSP. Se ejecuta abriendo `index.html`
(HTML/CSS/JS puros, sin instalación). La ayuda con las fórmulas en LaTeX usa KaTeX desde CDN, por lo que
necesita conexión a internet; sin ella se muestra el código LaTeX.

- **Algoritmos:** ANT-quantity, ANT-density y ANT-cycle (ecuaciones 3, 4 y 5 del artículo).
- **Parámetros:** número de hormigas *m*, α, β y ρ (ρ = fracción de rastro que persiste, como en el artículo).
  Al elegir algoritmo se cargan los parámetros del artículo; α, β y ρ se pueden cambiar en vivo.
- **Problemas:** cuadrículas 4×4, 5×5 y 6×6, 10 ciudades, Oliver30 (las 30 ciudades de la Fig. 3) y dos aleatorios.
- **Visualización:** hormigas dibujadas con patas animadas y rastro de feromonas con flujo, con velocidad ajustable (modo Turbo).
- **Experimento del obstáculo (Fig. 1 del artículo):** modo alternativo (selector «Experimento»). Las hormigas van del
  hormiguero a la comida; al colocar una roca en medio quedan un rodeo corto y otro largo (ajustable) y se ve cómo la
  colonia acaba usando el corto. Los tres algoritmos cambian cómo se deposita la feromona; la gráfica muestra el % de
  hormigas que elige el rodeo corto y el % de feromona en él. Simulación en tiempo continuo (`js/model/obstacleSim.js`).
- **Panel inferior:** longitud del mejor tour frente a ciclos (réplica de la Fig. 3) y comparación de los
  tres algoritmos superpuestos.
- **Botón `?`:** fórmulas en LaTeX, explicación de parámetros y código LaTeX copiable.

Arquitectura MVC: `js/model/` (algoritmo e instancias), `js/view/` (escenario, gráfica, controles, ayuda)
y `js/controller/` (bucle de animación y eventos).

> **Nota:** la instancia «10 ciudades (tipo CCAO)» usa coordenadas de sustitución, no las originales de
> Golden y Stewart. Las ecuaciones (3) y (4) del artículo contradicen el texto de la sección 4 sobre
> quantity y density; la app sigue las ecuaciones.

## Rúbrica → dónde se cubre

| Criterio de la rúbrica | Dónde |
|---|---|
| Comprensión y dominio del tema | `docs/guion.md` (preguntas probables) |
| Diapositivas ilustrativas y amenas | `docs/diapositivas/` |
| Exposición didáctica | `docs/guion.md` |
| Integración del equipo | `docs/guion.md` (reparto de bloques y preguntas) |
| Contenido (objetivos y requisitos) | `docs/informe/` |
| Divulgación de los contenidos | `docs/informe/` |
| Organización y presentación | estructura de este repositorio |
| Bibliografía | `docs/bibliografia.md` |
