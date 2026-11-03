const inputFecha = document.getElementById("fecha_avistamiento");

function fechaEsValida(valorFecha) {
    if (!valorFecha) return false;
    const fechaIngresada = new Date(valorFecha + "T00:00:00");
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const unAnioAtras = new Date(hoy);
    unAnioAtras.setFullYear(hoy.getFullYear() - 1);
    return fechaIngresada <= hoy && fechaIngresada >= unAnioAtras;
}

inputFecha.addEventListener("input", function () {
    this.setCustomValidity(
        !fechaEsValida(this.value) ? "La fecha no puede ser futura ni de hace más de 1 año." : ""
    );
});

// --- Al enviar: validar que haya al menos una foto o un video ---
document.getElementById("form-avistamiento").addEventListener("submit", function (evento) {
    const inputFoto = document.getElementById("foto_avistamiento");
    const inputVideo = document.getElementById("video_avistamiento");
    if (inputFoto.files.length === 0 && inputVideo.files.length === 0) {
        evento.preventDefault();
        alert("Debes adjuntar al menos una foto o un video.");
    }
});
