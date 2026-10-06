new Chart(document.getElementById("grafico-aves"), {
    type: "bar",
    data: {
        labels: etiquetasAve,
        datasets: [{
            label: "Avistamientos por ave",
            data: valoresAve,
            backgroundColor: "#2e7d32"
        }]
    },
    options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
});

new Chart(document.getElementById("grafico-regiones"), {
    type: "pie",
    data: {
        labels: etiquetasRegion,
        datasets: [{
            label: "Voluntarios por región",
            data: valoresRegion,
            backgroundColor: [
                "#2e7d32", "#66bb6a", "#a5d6a7", "#1b5e20",
                "#81c784", "#388e3c", "#c8e6c9", "#43a047",
                "#689f38", "#9ccc65", "#33691e", "#7cb342",
                "#c5e1a5", "#558b2f", "#aed581", "#004d00"
            ]
        }]
    },
    options: { responsive: true }
});
