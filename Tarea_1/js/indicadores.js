// Depende de: Chart.js (CDN), datos-simulados.js, voluntarios-simulados.js

// --- 1. Indicadores numéricos simples ---
document.getElementById("total-voluntarios").textContent = voluntariosSimulados.length;
document.getElementById("total-avistamientos").textContent = avistamientosSimulados.length;

// --- 2. Contar avistamientos por tipo de ave ---
// reduce() recorre el array y va acumulando un objeto {tipo: cantidad}
const conteoPorTipo = avistamientosSimulados.reduce(function (acumulador, avistamiento) {
    const tipo = avistamiento.tipo;
    acumulador[tipo] = (acumulador[tipo] || 0) + 1;
    return acumulador;
}, {});

// Object.keys/values nos dan arreglos paralelos: útiles para pasarle a Chart.js
const etiquetasTipo = Object.keys(conteoPorTipo);
const valoresTipo = Object.values(conteoPorTipo);

new Chart(document.getElementById("grafico-tipos"), {
    type: "bar",
    data: {
        labels: etiquetasTipo,
        datasets: [{
            label: "Avistamientos por tipo de ave",
            data: valoresTipo,
            backgroundColor: "#2e7d32"
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
});

// --- 3. Contar voluntarios por región ---
const conteoPorRegion = voluntariosSimulados.reduce(function (acumulador, voluntario) {
    const region = voluntario.region;
    acumulador[region] = (acumulador[region] || 0) + 1;
    return acumulador;
}, {});

const etiquetasRegion = Object.keys(conteoPorRegion);
const valoresRegion = Object.values(conteoPorRegion);

new Chart(document.getElementById("grafico-regiones"), {
    type: "pie",
    data: {
        labels: etiquetasRegion,
        datasets: [{
            label: "Voluntarios por región",
            data: valoresRegion,
            backgroundColor: [
                "#2e7d32", "#66bb6a", "#a5d6a7", "#1b5e20",
                "#81c784", "#388e3c", "#c8e6c9"
            ]
        }]
    },
    options: {
        responsive: true
    }
});
