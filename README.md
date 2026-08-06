# GamesSaloon — Xito Development

Colección de juegos de mesa (ajedrez, bingo, brisca, solitario, parchís, cinquillo, chinchón, damas, dominó, escoba, conecta 4, la oca, reversi, generala, buscaminas) con temas claro/oscuro estilo Material You, música relajante generativa y bots con dificultad ajustable.

## Cómo sacar el APK
1. Sube todo este contenido a un repositorio de GitHub (rama `main`).
2. Entra en la pestaña **Actions** → workflow **Compilar APK** → **Run workflow**. (El repo ya incluye el wrapper de Gradle, no hay que instalar nada.)
3. Cuando termine (unos 4-6 minutos), descarga el artefacto **GamesSaloon-APK**.
4. Descomprime e instala `app-debug.apk` en el móvil.

## Probar sin compilar
Abre `www/index.html` en el navegador del móvil o del PC: la app funciona igual.

## Estructura
- `www/` — toda la app (interfaz y juegos)
- `android/` — envoltorio Android que carga `www`
- `.github/workflows/android.yml` — compilación automática

## Estado
- Listos: Ajedrez, Bingo, Brisca, Solitario, Parchís, Cinquillo, Chinchón, Damas, Dominó, Escoba, Conecta 4, La Oca, Reversi, Generala y Buscaminas
- Online: salas por código hasta 6 jugadores en Bingo, Cinquillo, Brisca, Parchís y Conecta 4
- Extras: avatar y color por jugador, chat rápido de emojis, rangos por puntos, ranking global compartido y torneo de varias rondas en la misma sala

## Pruebas
`node tests/test.js`, `tests/brisca.js`, `tests/bingo.js`, `tests/bingo-partida.js` `tests/ajedrez.js` (perft) `tests/chinchon.js` y `tests/nuevos.js` simulan miles de jugadas en los ocho juegos y falla si algo casca. La compilación en GitHub las ejecuta antes de generar el APK.
