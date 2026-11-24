package cl.uchile.tarea4.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PruebaController {

    @GetMapping("/prueba")
    public String prueba() {
        return "Hola! Mi servidor Spring Boot funciona";
    }
}
