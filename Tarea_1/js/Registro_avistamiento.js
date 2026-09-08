document.getElementById("tipo_ave").addEventListener("change", function () {
    const tipoSeleccionado = this.value;
    const selectNombre = document.getElementById("nombre_ave");
 
    selectNombre.innerHTML = "";
 
    if (tipoSeleccionado === "") {
        selectNombre.disabled = true;
        selectNombre.innerHTML = '<option value="">-- Primero selecciona un tipo --</option>';
        return;
    }
 
    selectNombre.disabled = false;
    selectNombre.innerHTML = '<option value="">-- Selecciona un ave --</option>';
 
    const nombres = tiposDeAve[tipoSeleccionado];
    nombres.forEach(function (nombre) {
        const opcion = document.createElement("option");
        opcion.value = nombre;
        opcion.textContent = nombre;
        selectNombre.appendChild(opcion);
    });
});
 
// --- Validar que la fecha no sea futura ni "demasiado antigua" ---
// Regla que yo definí para el prototipo: se acepta hasta 1 año atrás.
const inputFecha = document.getElementById("fecha_avistamiento");
 
function fechaEsValida(valorFecha) {
    if (valorFecha === "") return false;
 
    const fechaIngresada = new Date(valorFecha + "T00:00:00");
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
 
    const unAnioAtras = new Date(hoy);
    unAnioAtras.setFullYear(hoy.getFullYear() - 1);
 
    return fechaIngresada <= hoy && fechaIngresada >= unAnioAtras;
}
 
inputFecha.addEventListener("input", function () {
    if (!fechaEsValida(this.value)) {
        this.setCustomValidity("La fecha no puede ser futura ni de hace más de 1 año.");
    } else {
        this.setCustomValidity("");
    }
});
 
// --- Validar que exista al menos una foto O un video ---
const inputFoto = document.getElementById("foto_avistamiento");
const inputVideo = document.getElementById("video_avistamiento");
const spanErrorArchivo = document.getElementById("archivo-error");
 
function hayFotoOVideo() {
    return inputFoto.files.length > 0 || inputVideo.files.length > 0;
}
 
// --- Envío del formulario ---
document.getElementById("form-avistamiento").addEventListener("submit", function (evento) {
    evento.preventDefault();
 
    if (!fechaEsValida(inputFecha.value)) {
        inputFecha.setCustomValidity("La fecha no puede ser futura ni de hace más de 1 año.");
        inputFecha.reportValidity();
        return;
    }
 
    if (!hayFotoOVideo()) {
        spanErrorArchivo.textContent = "Debes adjuntar al menos una foto o un video.";
        return;
    }
 
    spanErrorArchivo.textContent = "";
    alert("Avistamiento registrado (prototipo: no se almacena información real).");
    this.reset();
    document.getElementById("nombre_ave").disabled = true;
    document.getElementById("nombre_ave").innerHTML = '<option value="">-- Primero selecciona un tipo --</option>';
});