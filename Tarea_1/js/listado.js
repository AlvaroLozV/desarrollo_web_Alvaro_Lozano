// Depende de que datos-simulados.js ya esté cargado antes que este archivo.

const FILAS_POR_PAGINA = 5;
let paginaActual = 1;

// --- El "pipeline" de datos: filtrar -> ordenar -> paginar ---
// Nunca tocamos avistamientosSimulados directamente: siempre generamos
// una copia nueva en cada paso, para no perder los datos originales.

function obtenerDatosFiltradosYOrdenados() {
    const tipoFiltro = document.getElementById("filtro-tipo").value;
    const criterioOrden = document.getElementById("orden").value;

    // 1. Filtrar (si el filtro está en "todos", no se descarta nada)
    let resultado = avistamientosSimulados.filter(function (avistamiento) {
        return tipoFiltro === "" || avistamiento.tipo === tipoFiltro;
    });

    // 2. Ordenar. Hacemos una copia con [...resultado] antes de sort()
    // porque sort() modifica el array original "en el lugar" (in-place).
    resultado = [...resultado].sort(function (a, b) {
        if (criterioOrden === "fecha_asc") return a.fecha.localeCompare(b.fecha);
        if (criterioOrden === "fecha_desc") return b.fecha.localeCompare(a.fecha);
        if (criterioOrden === "lugar_asc") return a.lugar.localeCompare(b.lugar);
        return 0;
    });

    return resultado;
}

function renderizarTabla() {
    const datos = obtenerDatosFiltradosYOrdenados();

    // 3. Paginar: cortamos el array ya filtrado/ordenado
    const totalPaginas = Math.max(1, Math.ceil(datos.length / FILAS_POR_PAGINA));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * FILAS_POR_PAGINA;
    const datosPagina = datos.slice(inicio, inicio + FILAS_POR_PAGINA);

    // 4. Regenerar el <tbody> completo desde cero a partir de los datos
    const tbody = document.getElementById("tbody-avistamientos");
    tbody.innerHTML = "";

    if (datosPagina.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No hay avistamientos que coincidan con el filtro.</td></tr>';
    } else {
        datosPagina.forEach(function (avistamiento) {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${avistamiento.nombre}</td>
                <td>${avistamiento.tipo}</td>
                <td>${avistamiento.lugar}</td>
                <td>${avistamiento.fecha}</td>
                <td>${avistamiento.hora}</td>
            `;
            tbody.appendChild(fila);
        });
    }

    // 5. Actualizar controles de paginación
    document.getElementById("info-pagina").textContent =
        `Página ${paginaActual} de ${totalPaginas} (${datos.length} resultados)`;
    document.getElementById("btn-anterior").disabled = (paginaActual === 1);
    document.getElementById("btn-siguiente").disabled = (paginaActual === totalPaginas);
}

// --- Eventos ---
document.getElementById("filtro-tipo").addEventListener("change", function () {
    paginaActual = 1; // al cambiar el filtro, siempre volvemos a la página 1
    renderizarTabla();
});

document.getElementById("orden").addEventListener("change", function () {
    renderizarTabla();
});

document.getElementById("btn-anterior").addEventListener("click", function () {
    paginaActual--;
    renderizarTabla();
});

document.getElementById("btn-siguiente").addEventListener("click", function () {
    paginaActual++;
    renderizarTabla();
});

// --- Primer renderizado al cargar la página ---
renderizarTabla();
