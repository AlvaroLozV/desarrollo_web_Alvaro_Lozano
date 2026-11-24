const inputBusqueda = document.getElementById("busqueda");
const contenedorResultados = document.getElementById("resultados");

let numeroBusqueda = 0;


inputBusqueda.addEventListener("input", async function () {
    const texto = inputBusqueda.value.trim();
    const busquedaActual = ++numeroBusqueda;

    contenedorResultados.replaceChildren();

    if (texto === "") {
        return;
    }

    try {
        const respuesta = await fetch(
            `/api/avistamientos/buscar?texto=${encodeURIComponent(texto)}`
        );

        if (!respuesta.ok) {
            throw new Error("Error al buscar avistamientos");
        }

        const avistamientos = await respuesta.json();

        // Evitar mostrar resultados de búsquedas antiguas
        if (busquedaActual !== numeroBusqueda) {
            return;
        }

        mostrarResultados(avistamientos, texto);

    } catch (error) {
        if (busquedaActual !== numeroBusqueda) return;

        console.error(error);
        contenedorResultados.textContent =
            "Ocurrió un error al realizar la búsqueda.";
    }
});


function destacarTexto(texto, busqueda) {
    const fragmento = document.createDocumentFragment();
    const original = String(texto);
    const minuscula = original.toLowerCase();
    const patron = busqueda.toLowerCase();

    if (!patron) {
        fragmento.appendChild(document.createTextNode(original));
        return fragmento;
    }

    let posicion = 0;
    let indice = minuscula.indexOf(patron, posicion);

    while (indice !== -1) {
        fragmento.appendChild(
            document.createTextNode(original.slice(posicion, indice))
        );

        const marca = document.createElement("mark");
        marca.textContent = original.slice(
            indice, indice + patron.length
        );

        fragmento.appendChild(marca);

        posicion = indice + patron.length;
        indice = minuscula.indexOf(patron, posicion);
    }

    fragmento.appendChild(
        document.createTextNode(original.slice(posicion))
    );

    return fragmento;
}


function mostrarResultados(avistamientos, texto) {
    contenedorResultados.replaceChildren();

    if (avistamientos.length === 0) {
        contenedorResultados.textContent =
            "No se encontraron avistamientos.";
        return;
    }

    const tabla = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const encabezado = document.createElement("tr");

    const columnas = [
        "Ave", "Voluntario", "Fecha",
        "Comuna", "Nota", "Evaluar"
    ];

    columnas.forEach(nombre => {
        const th = document.createElement("th");
        th.textContent = nombre;
        encabezado.appendChild(th);
    });

    thead.appendChild(encabezado);

    avistamientos.forEach(a => {
        const fila = document.createElement("tr");

        // Datos del avistamiento
        const valores = [
            a.ave,
            a.voluntario,
            a.fechaHora.substring(0, 10),
            a.comuna
        ];

        valores.forEach((valor, indice) => {
            const td = document.createElement("td");

            if (indice === 2) {
                td.textContent = valor;
            } else {
                td.appendChild(destacarTexto(valor, texto));
            }

            fila.appendChild(td);
        });

        // Columna con el promedio
        const celdaPromedio = document.createElement("td");
        celdaPromedio.textContent =
            a.promedio == null ? "-" : a.promedio.toFixed(2);

        fila.appendChild(celdaPromedio);

        // Columna para evaluar
        const celdaEvaluar = document.createElement("td");

        const selector = document.createElement("select");
        selector.setAttribute(
            "aria-label",
            `Nota para avistamiento ${a.id}`
        );

        for (let nota = 1; nota <= 7; nota++) {
            const opcion = document.createElement("option");
            opcion.value = nota;
            opcion.textContent = nota;
            selector.appendChild(opcion);
        }

        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Evaluar";

        const mensaje = document.createElement("span");
        mensaje.setAttribute("role", "status");

        boton.addEventListener("click", async function () {
            boton.disabled = true;
            selector.disabled = true;
            mensaje.textContent = " Guardando...";

            try {
                const respuesta = await fetch(
                    `/api/avistamientos/${a.id}/notas`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            nota: Number(selector.value)
                        })
                    }
                );

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        datos.error || "No se pudo guardar la nota"
                    );
                }

                celdaPromedio.textContent =
                    datos.promedio.toFixed(2);

                mensaje.textContent = " ¡Guardado!";

            } catch (error) {
                console.error(error);
                mensaje.textContent = " Error al guardar.";
            } finally {
                boton.disabled = false;
                selector.disabled = false;
            }
        });

        celdaEvaluar.appendChild(selector);
        celdaEvaluar.appendChild(boton);
        celdaEvaluar.appendChild(mensaje);

        fila.appendChild(celdaEvaluar);
        tbody.appendChild(fila);
    });

    tabla.appendChild(thead);
    tabla.appendChild(tbody);
    contenedorResultados.appendChild(tabla);
}

