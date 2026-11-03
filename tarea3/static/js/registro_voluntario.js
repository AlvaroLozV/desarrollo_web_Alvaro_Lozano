const selectRegion = document.getElementById("region");
const selectComuna = document.getElementById("comuna");

const regionPrevia = selectRegion.dataset.previa || "";
const comunaPrevia = selectComuna.dataset.previa || "";

function cargarComunas(regionId, comunaAPreseleccionar) {
    selectComuna.innerHTML = "";

    if (!regionId) {
        selectComuna.disabled = true;
        selectComuna.innerHTML = '<option value="">-- Primero selecciona una región --</option>';
        return;
    }

    selectComuna.disabled = true;
    selectComuna.innerHTML = '<option value="">Cargando comunas...</option>';

    fetch(`/api/comunas/${regionId}`)
        .then(function (respuesta) {
            if (!respuesta.ok) throw new Error("Error al consultar comunas");
            return respuesta.json();
        })
        .then(function (comunas) {
            selectComuna.disabled = false;
            selectComuna.innerHTML = '<option value="">-- Selecciona una comuna --</option>';
            comunas.forEach(function (comuna) {
                const opcion = document.createElement("option");
                opcion.value = comuna.id;
                opcion.textContent = comuna.nombre;
                if (comunaAPreseleccionar && String(comuna.id) === String(comunaAPreseleccionar)) {
                    opcion.selected = true;
                }
                selectComuna.appendChild(opcion);
            });
        })
        .catch(function (error) {
            selectComuna.innerHTML = '<option value="">Error al cargar comunas</option>';
            console.error(error);
        });
}

selectRegion.addEventListener("change", function () {
    cargarComunas(this.value, null);
});

if (regionPrevia) {
    cargarComunas(regionPrevia, comunaPrevia);
}

// --- Validar teléfono chileno al escribir ---
document.getElementById("telefono").addEventListener("input", function () {
    const patron = /^\+?56\s?9\s?\d{4}\s?\d{4}$/;
    this.setCustomValidity(
        (this.value !== "" && !patron.test(this.value)) ? "Formato esperado: +56 9 1234 5678" : ""
    );
});
