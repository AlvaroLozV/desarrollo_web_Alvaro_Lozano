
# CC5002 - Tarea 4 - Registro Aviario

Álvaro Lozano

## Cómo levantar el proyecto

### 1. Requisitos previos

Para ejecutar la aplicación es necesario contar con:

- Java JDK 17 o superior (desarrollado con Java 25).
- MySQL Server ejecutándose en localhost:3306.
- Maven Wrapper (incluido en el proyecto).
- Navegador web.

### 2. Configurar la base de datos

Se utiliza la misma base de datos `tarea2` de las tareas anteriores, incorporando una nueva tabla para almacenar las evaluaciones de los avistamientos.

Si se está creando la base de datos desde cero, ejecutar los siguientes scripts SQL en MySQL Workbench, en este orden:

1. `tarea2.sql`: crea el esquema y las tablas principales.
2. `region-comuna.sql`: incorpora las regiones y comunas.
3. `aves.sql`: incorpora los nombres de las aves.
4. `tabla-comentario.sql`: crea la tabla de comentarios.
5. `tabla-nota.sql`: crea la tabla para las evaluaciones.

**Importante:** El archivo `tarea2.sql` elimina el esquema existente antes de crearlo nuevamente, por lo que no debe ejecutarse sobre una base de datos que contenga información que se desee conservar.

### 3. Configurar la conexión a MySQL

La conexión se configura en:

`src/main/resources/application.properties`

Se utilizan las siguientes propiedades:

    spring.application.name=tarea4

    spring.datasource.url=jdbc:mysql://localhost:3306/tarea2
    spring.datasource.username=cc5002
    spring.datasource.password=${DB_PASSWORD}

    spring.jpa.hibernate.ddl-auto=none
    spring.jpa.show-sql=true

La contraseña se obtiene desde la variable de entorno `DB_PASSWORD`, evitando almacenarla directamente en el código fuente.

En PowerShell, antes de ejecutar la aplicación:

    $env:DB_PASSWORD = "CONTRASEÑA_MYSQL"

Se debe reemplazar `CONTRASEÑA_MYSQL` por la contraseña correspondiente al usuario `cc5002`.

### 4. Ejecutar la aplicación

Desde la carpeta raíz del proyecto Spring Boot, donde se encuentra `pom.xml`, ejecutar:

    .\mvnw.cmd spring-boot:run

En Linux o macOS:

    ./mvnw spring-boot:run

### 5. Acceder a la aplicación

Una vez iniciado Spring Boot, abrir en el navegador:

http://localhost:8080/buscador.html

La aplicación permite buscar avistamientos y evaluarlos sin necesidad de recargar la página.

## Funcionalidades implementadas

### Buscador de avistamientos

- Búsqueda automática mientras el usuario escribe.
- Búsqueda por nombre del ave, nombre del voluntario o nombre de la comuna.
- Visualización del ave, voluntario, fecha, comuna y promedio de evaluaciones.
- Destacado de las coincidencias con el texto ingresado.
- Mensaje informativo cuando no existen resultados.

### Evaluación de avistamientos

- Cada avistamiento puede recibir múltiples evaluaciones.
- Las notas deben ser números enteros entre 1 y 7.
- Las evaluaciones se almacenan en la tabla `nota` de MySQL.
- El promedio se calcula a partir de las evaluaciones registradas.
- Cuando no existen evaluaciones, se muestra `-`.
- Al registrar una evaluación, el promedio se actualiza sin recargar la página.

## Decisiones de diseño

- **Migración de Flask a Spring Boot.** Para cumplir los requerimientos de la Tarea 4, el backend se implementó utilizando Java y Spring Boot. Se mantuvo la base de datos MySQL utilizada en las tareas anteriores.

- **Persistencia mediante Spring Data JPA.** Se crearon entidades Java para representar las tablas de la base de datos y repositorios que permiten realizar consultas e inserciones mediante JPA. Esto evita escribir manualmente las consultas SQL más comunes.

- **Separación entre controladores, modelos, repositorios y DTO.** Se organizó el proyecto en paquetes según la responsabilidad de cada componente. Los controladores gestionan las solicitudes HTTP, las entidades representan los datos, los repositorios interactúan con MySQL y los DTO definen la información intercambiada con el cliente.

- **Búsqueda mediante consultas JPQL.** Se implementó una consulta que relaciona las entidades `Avistamiento`, `Ave`, `Voluntario` y `Comuna`. Se utiliza `LIKE` para buscar coincidencias parciales y `LOWER` para evitar diferencias por mayúsculas y minúsculas.

- **Comunicación asíncrona mediante JavaScript.** El frontend utiliza `fetch()` para consultar los avistamientos y registrar evaluaciones sin recargar la página. Las respuestas se procesan en formato JSON.

- **Control de solicitudes de búsqueda.** Se utiliza un contador para identificar la búsqueda más reciente y evitar que respuestas antiguas sobrescriban los resultados actuales cuando el usuario escribe rápidamente.

- **Destacado seguro de coincidencias.** Los resultados se construyen mediante métodos del DOM, utilizando `textContent`, `createTextNode` y elementos `<mark>`. De esta manera, los textos ingresados no se interpretan como código HTML.

- **Validación de notas en el servidor.** El backend comprueba que las evaluaciones correspondan a números enteros entre 1 y 7. Esto permite rechazar solicitudes inválidas incluso cuando se realizan directamente a la API, sin utilizar el formulario HTML.

- **Cálculo dinámico del promedio.** Se utiliza la función `AVG` mediante una consulta JPQL para calcular el promedio de las notas asociadas a cada avistamiento. El promedio no se almacena como una columna adicional, evitando redundancia y posibles inconsistencias.

- **Conservación de la estructura de MySQL.** Se configuró `spring.jpa.hibernate.ddl-auto=none` para impedir que Hibernate modifique automáticamente las tablas previamente creadas mediante los scripts SQL.

- **Configuración de credenciales.** La contraseña de MySQL se obtiene mediante una variable de entorno, evitando incorporarla directamente al repositorio público.

## Estructura del proyecto

    src/
    └── main/
        ├── java/cl/uchile/tarea4/
        │   ├── Tarea4Application.java
        │   ├── controller/
        │   │   ├── PruebaController.java
        │   │   ├── AveController.java
        │   │   ├── AvistamientoController.java
        │   │   └── NotaController.java
        │   ├── model/
        │   │   ├── Ave.java
        │   │   ├── Comuna.java
        │   │   ├── Voluntario.java
        │   │   ├── Avistamiento.java
        │   │   └── Nota.java
        │   ├── repository/
        │   │   ├── AveRepository.java
        │   │   ├── AvistamientoRepository.java
        │   │   └── NotaRepository.java
        │   └── dto/
        │       └── ResultadoBusquedaDTO.java
        └── resources/
            ├── application.properties
            └── static/
                ├── buscador.html
                └── js/
                    └── buscador.js

    pom.xml
    mvnw
    mvnw.cmd

## Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/aves` | Obtiene las aves registradas. |
| GET | `/api/avistamientos` | Obtiene los avistamientos. |
| GET | `/api/avistamientos/buscar?texto=...` | Busca avistamientos por ave, voluntario o comuna. |
| POST | `/api/avistamientos/{id}/notas` | Registra una evaluación y devuelve el promedio actualizado. |

## Consideraciones adicionales

- La aplicación utiliza la base de datos `tarea2` y requiere que el servidor MySQL esté funcionando.
- Deben existir avistamientos registrados para obtener resultados en el buscador.
- La búsqueda se realiza a medida que se escribe, utilizando solicitudes HTTP asíncronas.
- Las notas se almacenan individualmente para permitir múltiples evaluaciones por avistamiento.
- El frontend se encuentra dentro de los recursos estáticos de Spring Boot y se sirve desde el mismo servidor que la API.
