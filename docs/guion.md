# Guion de la exposición

**Trabajo:** Colorni, Dorigo y Maniezzo (1992). *Distributed Optimization by Ant Colonies*. ECAL 91, Elsevier, pp. 134–142.
**Equipo:** _[nombres]_ · **Duración:** _[X min]_ · **Fecha:** _[fecha]_

> Cada bloque indica a quién de la rúbrica ayuda. Reparto de ejemplo para 3 personas
> (A, B, C); cambiadlo a vuestro equipo. Para **«Integración del equipo»** conviene que
> todos hablen y que cualquiera sepa responder a preguntas de cualquier bloque.

## Esquema (≈ 10–12 diapositivas, poco texto, mucha imagen)

| # | Diapositiva | Mensaje clave (1 frase) | Habla | Apoyo visual |
|---|---|---|---|---|
| 1 | Título | Optimización con colonias de hormigas | A | Título + foto/ilustración de hormigas |
| 2 | Guion | De qué vamos a hablar (4 bloques) | A | Índice simple |
| 3 | El problema: TSP | Visitar n ciudades una vez con el recorrido más corto; es NP-difícil | A | Mapa de ciudades con un recorrido bueno y otro malo |
| 4 | Inspiración biológica | Hormigas casi ciegas encuentran el camino más corto con feromonas | A | Figura 1 del artículo (obstáculo A–E, caminos BCD / BGD) |
| 5 | Realimentación positiva | Más hormigas → más feromona → más hormigas (autocatálisis); la elección nunca es determinista, así se sigue explorando | A | Esquema del bucle |
| 6 | El Ant System: 3 ingredientes | **Feromona** τ, **visibilidad** η = 1/d, **lista tabú** | B | Un icono por ingrediente |
| 7 | Cómo decide una hormiga | Ec. (2): p_ij ∝ τ_ij^α · η_ij^β (solo ciudades no visitadas) | B | Ejemplo numérico con 3 ciudades candidatas |
| 8 | Cómo se actualiza la feromona | Ec. (1): τ(t+1) = ρ·τ(t) + Δτ | B | Animación: rastro que se evapora y se refuerza |
| 9 | Tres variantes | density: Q · quantity: Q/d_ij · **cycle: Q/L_k** | B | Tabla de 3 filas |
| 10 | Resultados del artículo | ANT-cycle es el mejor; 30 ciudades: tour de 423,741 (420 con enteros) frente a 421 previo; Eilon50: 438 (mejor conocido 428) | C | Figs. 6 y 7 del artículo |
| 11 | Parámetros y nº de hormigas | β es el más importante; α entre 1 y 1,5; ρ ≈ 0,7; ANT-cycle encuentra el óptimo con cualquier nº de hormigas | C | Gráfica sencilla |
| 12 | Conclusiones y trabajo futuro | «¿Por qué funciona?» sigue abierta; 4 líneas futuras (teoría, generalidad, IA/aprendizaje, paralelismo) | C | 4 iconos |
| 13 | Bibliografía | Artículo + referencias citadas | C | Lista corta |

## Texto de cada bloque

### Bloque 1 · Motivación (A)
- «Una hormiga sola es simple, pero la colonia se comporta de forma muy organizada.»
- Pregunta gancho: *¿cómo encuentran el camino más corto animales casi ciegos?* → con **feromonas**.
- Experimento del obstáculo (Fig. 1): al aparecer un obstáculo, el camino más corto se refuerza
  antes porque las hormigas lo recorren más veces por unidad de tiempo → todas acaban en él.
- Idea para el algoritmo: agentes simples que **no saben que cooperan**.

### Bloque 2 · El algoritmo (B)
- Definiciones: *m* hormigas, *n* ciudades, d_ij distancia euclídea.
- Decisión: probabilidad con α (peso de la feromona) y β (peso de la distancia).
  Casos límite útiles para explicar: α = 0 → voraz estocástico; β = 0 → solo feromona.
- Lista tabú: memoria de ciudades visitadas hasta cerrar el ciclo (no es la búsqueda tabú de Glover:
  sin función de aspiración y guarda ciudades, no permutaciones).
- Variantes: en **density** y **quantity** se deposita en cada paso; en **cycle** solo al terminar
  el recorrido, proporcional a su calidad (1/L_k).

### Bloque 3 · Resultados (C)
- Qué probaron: 10 ciudades (CCAO), 30, 50 y 75 ciudades, y una rejilla 4×4 con óptimo 16.
- Mensajes: cycle > density ≈ quantity; β es crítico (sin β no hay convergencia); con β > 5 se
  atasca en soluciones subóptimas.
- Honestidad: en 50 y 75 ciudades **no** llegaron al óptimo (3000 ciclos, pocas pruebas).

### Bloque 4 · Cierre (todos)
- Idea fuerza del artículo: proceso autocatalítico + «fuerza voraz» → buenas soluciones rápido.
- Limitaciones que reconocen los autores: falta teoría matemática; pocas instancias.
- Relevancia posterior: origen de la familia ACO (ver bibliografía).

## Preguntas probables y quién las toma
| Pregunta | Idea de respuesta | Responde |
|---|---|---|
| ¿Por qué el algoritmo no se queda con la primera solución? | La elección es probabilística y la feromona se evapora (ρ < 1) | B |
| ¿Qué pasa si α es muy grande? | Converge pronto a soluciones subóptimas (paper: α ≥ 2) | B |
| ¿Por qué ANT-cycle funciona mejor? | Premia por la calidad del recorrido completo, no por pasos sueltos | C |
| ¿Qué papel tiene la visibilidad? | Es el «empujón voraz»: ciudades cercanas más probables | B |
| ¿Se puede usar en otros problemas? | Los autores lo plantean como línea futura (y citan su informe técnico) | C |
| ¿Es paralelizable? | Sí, las hormigas son independientes dentro de un ciclo (línea futura del paper) | A |
| ¿Cuál es el coste de usar más hormigas? | Más sobrecarga de gestión: la eficiencia baja con muchas hormigas | C |

## Checklist antes de exponer
- [ ] Cada diapositiva: máx. ~30 palabras y una imagen o esquema.
- [ ] Todos los miembros han hablado y han ensayado al menos 1 pregunta de otro bloque.
- [ ] Tiempos cronometrados con un ensayo completo.
- [ ] Bibliografía de la última diapositiva = la de `docs/bibliografia.md`.
