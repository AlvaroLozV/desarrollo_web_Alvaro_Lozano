# CC5002 - Tarea 3 - Registro Aviario

Alvaro Lozano

## Cómo levantar el proyecto

1. Crear y activar un entorno virtual:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
2. Instalar dependencias:
   ```
   pip install -r requirements.txt
   ```
3. Crear la base de datos (requiere MySQL Server corriendo en localhost:3306):
   ```
   -- Ejecutar en MySQL Workbench o consola, en este orden:
   -- 1) tarea2.sql  (crea el schema, las tablas, y el usuario cc5002)
   -- 2) region-comuna.sql
   -- 3) aves.sql
   4. `tabla-comentario.sql` 
   ```
4. Ejecutar la app:
   ```
   python app.py
   ```
5. Abrir `http://127.0.0.1:5000/` en el navegador.

## Librerías de gráficos
 
Se usa **Chart.js 4.4.4** (https://www.chartjs.org/), licencia MIT, cargada desde el CDN de jsDelivr con una etiqueta `<script>` en `estadisticas.html`. No requiere instalación, pero la página de estadísticas necesita internet para descargar la librería.
 
## Decisiones de diseño (Tarea 3)
 
### Estadísticas
 
- **Los datos no van incrustados en la página.** `estadisticas.html` solo trae el esqueleto con tres `<canvas>`. El archivo `static/js/estadisticas.js` pide los datos con `fetch()` a tres URLs de Flask (`/api/estadisticas/avistamientos-por-dia`, `/avistamientos-por-ave` y `/voluntarios-por-comuna`). Cada una consulta la base de datos con SQLAlchemy (`func.count` + `group_by`) y devuelve JSON con la forma `{"etiquetas": [...], "valores": [...]}`.
- **Cada gráfico se pide por separado.** Si una de las URLs falla, solo ese gráfico muestra un aviso y los otros dos siguen funcionando.
- **"Tipo de ave"** La tabla `ave` entregada solo tiene `id` y `nombre`, agrupa los avistamientos por ave.
- **Avistamientos por día** agrupa por la fecha del avistamiento (`fecha_hora`). Solo aparecen los días en que hubo al menos un avistamiento.
- **Voluntarios por comuna** solo aparecen las comunas con al menos un voluntario.
- Se usa el enlace de volver que tiene el resto de las pestañas en la parte superior izquierda.

### Comentarios
 
- **Tabla `comentario`** creada con el script `tabla-comentario.sql` del enunciado y modelada en `models.py`.
- **API JSON**: `GET /api/avistamiento/<id>/comentarios` entrega el listado y `POST` (con cuerpo JSON) agrega un comentario. En el detalle del avistamiento, `static/js/comentarios.js` carga el listado con `fetch()` al abrir la página y envía el formulario también con `fetch()`: la página no se recarga y el comentario nuevo aparece arriba (el listado va del más reciente al más antiguo).
- **Validación en el navegador y en el servidor.** Nombre de 3 a 50 caracteres y texto de al menos 5. Se agregó un máximo de 300 caracteres al texto porque la columna es `VARCHAR(300)`. Si el servidor rechaza el comentario responde 400 con un JSON `{"errores": {campo: mensaje}}`, el JS muestra cada mensaje bajo su campo y el formulario se mantiene para corregir.
- **Entradas maliciosas.** Los comentarios se insertan en la página con `textContent`, por lo que un `<script>` o cualquier HTML escrito en un comentario se muestra como texto y nunca se ejecuta. Las consultas pasan por el ORM (parametrizadas), y en el servidor cualquier valor que no sea texto se trata como vacío.
- **Emojis.** El esquema usa `utf-8`, para detectar emoji, reconoce que estos tienen una mayor codificación en bytes, así que viendo el tamaño, MySQL rechaza el INSERT. En vez de dejar que eso termine en un error 500, el navegador y el servidor avisan que el nombre/comentario contiene caracteres no soportados. Además, si la base de datos falla al guardar por cualquier otro motivo, el servidor responde con JSON (no con una página de error) y hace `rollback`.

## Decisiones de diseño

- **Conector MySQL: PyMySQL está escrito en Python puro, por lo que no requiere compilar nada en Windows durante la instalación.

- **Validación duplicada (cliente y servidor).** Todas las validaciones de JavaScript de la Tarea 1 se mantuvieron intactas en el frontend, pero se repitieron completas en `app.py`. Esto es necesario porque así el servidor nunca confía en lo que recibe, a pesar de que ya fueron validados.

- **Protección contra entradas maliciosas.** Toda la interacción con la base de datos pasa por el ORM de SQLAlchemy, que parametriza automáticamente las consultas y evita inyección SQL. Las plantillas usan Jinja2, que escapa HTML por defecto en cada variable interpolada (`{{ variable }}`), evitando ataques XSS si un usuario ingresa, por ejemplo, una etiqueta `<script>` en el campo "lugar". Los nombres de archivos subidos se sanitizan con `secure_filename()` de Werkzeug antes de guardarlos en disco, y se les antepone un prefijo (`id_timestamp_`) para evitar que dos archivos con el mismo nombre se sobrescriban entre sí.

- **Filtro de avistamientos por ave, no por "tipo".** En la Tarea 1 se filtraba por categorías (rapaz, acuática, etc.), pero la tabla `ave` entregada en `aves.sql` solo tiene `id` y `nombre`, sin columna de tipo. Se adaptó el filtro del listado para operar directamente sobre el ave específica.

- **Regla de validación de fecha.** Se definió que la fecha/hora de un avistamiento no puede ser futura ni tener más de 1 año de antigüedad respecto al momento de la validación. Elegida para tener un sistema de registro de avistamientos recientes.

- **Cascada región → comuna vía AJAX.** A diferencia de la Tarea 1 (donde las comunas vivían en un objeto JavaScript fijo), ahora se consulta un endpoint propio (`/api/comunas/<region_id>`) que devuelve JSON, ya que los datos reales viven en la base de datos y pueden cambiar.

## Estructura del proyecto

```
app.py                       - Rutas y lógica de la aplicación
models.py                    - Modelos SQLAlchemy (uno por tabla)
templates/                   - Plantillas Jinja2
static/css/estilos.css       - Estilos compartidos
static/js/estadisticas.js    - Gráficos (fetch + Chart.js)
static/js/comentarios.js     - Listado y alta de comentarios (fetch)
static/js/                   - Validaciones y cascada AJAX de los formularios
static/uploads/              - Fotos y videos subidos por los usuarios
tarea2.sql, region-comuna.sql, aves.sql, tabla-comentario.sql - Scripts de base de datos
```
