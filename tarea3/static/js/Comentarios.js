// Comentarios de un avistamiento, todo con llamadas asíncronas (fetch):
//   - al cargar la página: GET  /api/avistamiento/<id>/comentarios  -> listado
//   - al enviar el form:   POST /api/avistamiento/<id>/comentarios  -> nuevo comentario
// La página nunca se recarga: el JS actualiza la lista directamente.
 
const seccion = document.getElementById("comentarios");
const urlComentarios = `/api/avistamiento/${seccion.dataset.avistamientoId}/comentarios`;
 
const lista = document.getElementById("lista-comentarios");
const form = document.getElementById("form-comentario");
const inputNombre = document.getElementById("comentario_nombre");
const inputTexto = document.getElementById("comentario_texto");
const errorNombre = document.getElementById("error-nombre");
const errorTexto = document.getElementById("error-texto");
const mensaje = document.getElementById("mensaje-comentario");
 
// Arma el <li> de un comentario. Usamos textContent (protección contra XSS).
function crearItemComentario(comentario) {
    const item = document.createElement("li");
 
    const encabezado = document.createElement("strong");
    encabezado.textContent = `${comentario.nombre} — ${comentario.fecha}`;
 
    const texto = document.createElement("p");
    texto.textContent = comentario.texto;
 
    item.append(encabezado, texto);
    return item;
}
 
function mostrarSinComentarios() {
    const item = document.createElement("li");
    item.id = "sin-comentarios";
    item.textContent = "Aún no hay comentarios.";
    lista.append(item);
}
 
// --- Cargar el listado al abrir la página ---
async function cargarComentarios() {
    try {
        const respuesta = await fetch(urlComentarios);
        if (!respuesta.ok) {
            throw new Error(`Error ${respuesta.status}`);
        }
        const comentarios = await respuesta.json();
 
        lista.replaceChildren();
        if (comentarios.length === 0) {
            mostrarSinComentarios();
        }
        comentarios.forEach(function (comentario) {
            lista.append(crearItemComentario(comentario));
        });
    } catch (error) {
        lista.textContent = "No se pudieron cargar los comentarios.";
        console.error(error);
    }
}
 
// --- Validación en el navegador (el servidor la repite igual) ---
// Todos los caracteres de uft-8 no soportados
const CARACTERES_NO_SOPORTADOS = /[\u{10000}-\u{10FFFF}]/u;
 
function validar(nombre, texto) {
    const errores = {};
    if (nombre.length < 3 || nombre.length > 50) {
        errores.nombre = "El nombre debe tener entre 3 y 50 caracteres.";
    } else if (CARACTERES_NO_SOPORTADOS.test(nombre)) {
        errores.nombre = "El nombre contiene caracteres no soportados (por ejemplo, emojis).";
    }
    if (texto.length < 5 || texto.length > 300) {
        errores.texto = "El comentario debe tener entre 5 y 300 caracteres.";
    } else if (CARACTERES_NO_SOPORTADOS.test(texto)) {
        errores.texto = "El comentario contiene caracteres no soportados (por ejemplo, emojis).";
    }
    return errores;
}
 
function mostrarErrores(errores) {
    errorNombre.textContent = errores.nombre || "";
    errorTexto.textContent = errores.texto || "";
    mensaje.textContent = errores.general || "";
}
 
// --- Enviar un comentario nuevo ---
form.addEventListener("submit", async function (evento) {
    evento.preventDefault(); // evita la recarga normal del formulario
    mensaje.textContent = "";
 
    const nombre = inputNombre.value.trim();
    const texto = inputTexto.value.trim();
 
    const erroresLocales = validar(nombre, texto);
    mostrarErrores(erroresLocales);
    if (Object.keys(erroresLocales).length > 0) {
        return; // no se envía nada al servidor; el formulario sigue visible
    }
 
    try {
        const respuesta = await fetch(urlComentarios, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: nombre, texto: texto })
        });
        const datos = await respuesta.json();
 
        if (!respuesta.ok) {
            // El servidor rechazó el comentario: mostramos sus mensajes y puede corregir.
            mostrarErrores(datos.errores || {});
            return;
        }
 
        const sinComentarios = document.getElementById("sin-comentarios");
        if (sinComentarios) {
            sinComentarios.remove();
        }
        lista.prepend(crearItemComentario(datos.comentario));
        form.reset();
        mostrarErrores({});
        mensaje.textContent = "Comentario agregado.";
    } catch (error) {
        mensaje.textContent = "No se pudo enviar el comentario. Intenta de nuevo.";
        console.error(error);
    }
});
 
cargarComentarios();
 