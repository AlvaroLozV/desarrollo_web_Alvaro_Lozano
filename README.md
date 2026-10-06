# CC5002 - Tarea 2 - Registro Aviario

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
   ```
4. Ejecutar la app:
   ```
   python app.py
   ```
5. Abrir `http://127.0.0.1:5000/` en el navegador.

## Decisiones de diseño

- **Conector MySQL: PyMySQL está escrito en Python puro, por lo que no requiere compilar nada en Windows durante la instalación.

- **Validación duplicada (cliente y servidor).** Todas las validaciones de JavaScript de la Tarea 1 se mantuvieron intactas en el frontend, pero se repitieron completas en `app.py`. Esto es necesario porque así el servidor nunca confía en lo que recibe, a pesar de que ya fueron validados.

- **Protección contra entradas maliciosas.** Toda la interacción con la base de datos pasa por el ORM de SQLAlchemy, que parametriza automáticamente las consultas y evita inyección SQL. Las plantillas usan Jinja2, que escapa HTML por defecto en cada variable interpolada (`{{ variable }}`), evitando ataques XSS si un usuario ingresa, por ejemplo, una etiqueta `<script>` en el campo "lugar". Los nombres de archivos subidos se sanitizan con `secure_filename()` de Werkzeug antes de guardarlos en disco, y se les antepone un prefijo (`id_timestamp_`) para evitar que dos archivos con el mismo nombre se sobrescriban entre sí.

- **Filtro de avistamientos por ave, no por "tipo".** En la Tarea 1 se filtraba por categorías (rapaz, acuática, etc.), pero la tabla `ave` entregada en `aves.sql` solo tiene `id` y `nombre`, sin columna de tipo. Se adaptó el filtro del listado para operar directamente sobre el ave específica.

- **Regla de validación de fecha.** Se definió que la fecha/hora de un avistamiento no puede ser futura ni tener más de 1 año de antigüedad respecto al momento de la validación. Elegida para tener un sistema de registro de avistamientos recientes.

- **Cascada región → comuna vía AJAX.** A diferencia de la Tarea 1 (donde las comunas vivían en un objeto JavaScript fijo), ahora se consulta un endpoint propio (`/api/comunas/<region_id>`) que devuelve JSON, ya que los datos reales viven en la base de datos y pueden cambiar.

## Estructura del proyecto

```
app.py                  - Rutas y lógica de la aplicación
models.py                - Modelos SQLAlchemy (uno por tabla)
templates/                - Plantillas Jinja2
static/css/estilos.css    - Estilos compartidos
static/js/                - Validaciones y cascada AJAX del lado del cliente
static/uploads/           - Fotos y videos subidos por los usuarios
tarea2.sql, region-comuna.sql, aves.sql - Scripts de base de datos entregados en el enunciado
```
