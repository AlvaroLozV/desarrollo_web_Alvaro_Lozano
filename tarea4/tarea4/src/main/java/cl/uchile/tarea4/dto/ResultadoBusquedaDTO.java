package cl.uchile.tarea4.dto;

import java.time.LocalDateTime;

public record ResultadoBusquedaDTO(
    Integer id,
    String voluntario,
    LocalDateTime fechaHora,
    String ave,
    String comuna,
    Double promedio
) {
}

