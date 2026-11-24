package cl.uchile.tarea4.controller;

import cl.uchile.tarea4.dto.NuevaNotaDTO;
import cl.uchile.tarea4.model.Avistamiento;
import cl.uchile.tarea4.model.Nota;
import cl.uchile.tarea4.repository.AvistamientoRepository;
import cl.uchile.tarea4.repository.NotaRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;

import java.util.Map;

@RestController
@RequestMapping("/api/avistamientos")
public class NotaController {

    private final NotaRepository notaRepository;
    private final AvistamientoRepository avistamientoRepository;

    public NotaController(
            NotaRepository notaRepository,
            AvistamientoRepository avistamientoRepository) {

        this.notaRepository = notaRepository;
        this.avistamientoRepository = avistamientoRepository;
    }

    
    @PostMapping("/{id}/notas")
    public ResponseEntity<?> agregarNota(
            @PathVariable Integer id,
            @RequestBody JsonNode datos) {

        // 1. Validar que sea un entero entre 1 y 7
        JsonNode nodoNota = datos == null ? null : datos.get("nota");

        if (nodoNota == null ||
                !nodoNota.isIntegralNumber() ||
                !nodoNota.canConvertToInt()) {

            return ResponseEntity.badRequest().body(
                Map.of("error", "La nota debe ser un entero entre 1 y 7.")
            );
        }

        int valor = nodoNota.intValue();

        if (valor < 1 || valor > 7) {
            return ResponseEntity.badRequest().body(
                Map.of("error", "La nota debe ser un entero entre 1 y 7.")
            );
        }

        // 2. Buscar el avistamiento
        Avistamiento avistamiento =
                avistamientoRepository.findById(id).orElse(null);

        if (avistamiento == null) {
            return ResponseEntity.status(404).body(
                Map.of("error", "El avistamiento no existe.")
            );
        }

        // 3. Guardar la nueva nota
        Nota nuevaNota = new Nota(valor, avistamiento);
        notaRepository.saveAndFlush(nuevaNota);

        // 4. Calcular el promedio actualizado
        Double promedio = notaRepository.obtenerPromedio(id);

        // 5. Devolver el resultado
        return ResponseEntity.ok(
            Map.of(
                "mensaje", "Nota registrada correctamente",
                "promedio", promedio
            )
        );
    }

}

