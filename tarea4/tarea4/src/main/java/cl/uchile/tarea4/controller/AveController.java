package cl.uchile.tarea4.controller;

import cl.uchile.tarea4.model.Ave;
import cl.uchile.tarea4.repository.AveRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AveController {

    private final AveRepository aveRepository;

    public AveController(AveRepository aveRepository) {
        this.aveRepository = aveRepository;
    }

    @GetMapping("/api/aves")
    public List<Ave> obtenerAves() {
        return aveRepository.findAll();
    }
}
