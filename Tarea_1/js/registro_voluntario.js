document.getElementById("region").addEventListener("change", function () {
    const regionSeleccionada = this.value;
    const selectComuna = document.getElementById("comuna");

    selectComuna.innerHTML = "";

    if (regionSeleccionada === "") {
        selectComuna.disabled = true;
        selectComuna.innerHTML = '<option value="">-- Primero selecciona una región --</option>';
        return;
    }

    selectComuna.disabled = false;
    selectComuna.innerHTML = '<option value="">-- Selecciona una comuna --</option>';

    const comunas = regionesComunas[regionSeleccionada];
    comunas.forEach(function (comuna) {
        const opcion = document.createElement("option");
        opcion.value = comuna;
        opcion.textContent = comuna;
        selectComuna.appendChild(opcion);
    });
});

