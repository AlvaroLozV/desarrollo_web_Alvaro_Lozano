package cl.uchile.tarea4.controller;

import cl.uchile.tarea4.model.Avistamiento;
import cl.uchile.tarea4.repository.AvistamientoRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.uchile.tarea4.dto.ResultadoBusquedaDTO;
import org.springframework.web.bind.annotation.RequestParam;
import cl.uchile.tarea4.repository.NotaRepository;


import java.util.List;

@RestController
public class AvistamientoController {
    private final NotaRepository notaRepository;

    private final AvistamientoRepository avistamientoRepository;

    
public AvistamientoController(
        AvistamientoRepository avistamientoRepository,
        NotaRepository notaRepository) {

    this.avistamientoRepository = avistamientoRepository;
    this.notaRepository = notaRepository;
}


    @GetMapping("/api/avistamientos")
    public List<Avistamiento> obtenerAvistamientos() {
        return avistamientoRepository.findAll();
    }

    
    @GetMapping("/api/avistamientos/buscar")
    public List<ResultadoBusquedaDTO> buscarAvistamientos(
            @RequestParam(defaultValue = "") String texto) {

        return avistamientoRepository.buscar(texto)
            .stream()
            .map(a -> new ResultadoBusquedaDTO(
                a.getId(),
                a.getVoluntario().getNombre(),
                a.getFechaHora(),
                a.getAve().getNombre(),
                a.getVoluntario().getComuna().getNombre(),
                notaRepository.obtenerPromedio(a.getId())
            ))
            .toList();
    }

}


