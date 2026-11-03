
 
// Devuelve el JSON de una URL, o lanza un error si el servidor respondió mal.
async function obtenerJSON(url) {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`Error ${respuesta.status} al consultar ${url}`);
    }
    return respuesta.json();
}
 
// Genera n colores repartidos en el círculo cromático (para la torta, que
// necesita un color distinto por cada porción).
function colores(n) {
    return Array.from({ length: n }, function (_, i) {
        return `hsl(${Math.round((360 * i) / n)}, 60%, 55%)`;
    });
}
 
// Si un gráfico falla, se reemplaza su canvas por un aviso (los otros dos
// siguen funcionando porque cada uno se pide por separado).
function avisarError(idCanvas) {
    const aviso = document.createElement("p");
    aviso.className = "mensaje-error";
    aviso.textContent = "No se pudo cargar este gráfico.";
    document.getElementById(idCanvas).replaceWith(aviso);
}
 
// --- 1. Líneas: avistamientos por día ---
async function graficoAvistamientosPorDia() {
    const datos = await obtenerJSON("/api/estadisticas/avistamientos-por-dia");
    new Chart(document.getElementById("grafico-dias"), {
        type: "line",
        data: {
            labels: datos.etiquetas,
            datasets: [{
                label: "Avistamientos",
                data: datos.valores,
                borderColor: "#2e7d32",
                backgroundColor: "#2e7d32",
                tension: 0.2
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                x: { title: { display: true, text: "Día" } },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    title: { display: true, text: "Cantidad de avistamientos" }
                }
            }
        }
    });
}
 
// --- 2. Torta: avistamientos por ave ---
async function graficoAvistamientosPorAve() {
    const datos = await obtenerJSON("/api/estadisticas/avistamientos-por-ave");
    new Chart(document.getElementById("grafico-aves"), {
        type: "pie",
        data: {
            labels: datos.etiquetas,
            datasets: [{
                data: datos.valores,
                backgroundColor: colores(datos.valores.length)
            }]
        },
        options: {
            plugins: { legend: { position: "bottom" } }
        }
    });
}
 
// --- 3. Barras: voluntarios por comuna ---
async function graficoVoluntariosPorComuna() {
    const datos = await obtenerJSON("/api/estadisticas/voluntarios-por-comuna");
    new Chart(document.getElementById("grafico-comunas"), {
        type: "bar",
        data: {
            labels: datos.etiquetas,
            datasets: [{
                label: "Voluntarios",
                data: datos.valores,
                backgroundColor: "#2e7d32"
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                x: { title: { display: true, text: "Comuna" } },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    title: { display: true, text: "Voluntarios registrados" }
                }
            }
        }
    });
}
 
// Cada gráfico se pide de forma independiente: si uno falla, solo ese muestra el aviso.
graficoAvistamientosPorDia().catch(function () { avisarError("grafico-dias"); });
graficoAvistamientosPorAve().catch(function () { avisarError("grafico-aves"); });
graficoVoluntariosPorComuna().catch(function () { avisarError("grafico-comunas"); });