package cl.uchile.tarea4.repository;

import cl.uchile.tarea4.model.Nota;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotaRepository
        extends JpaRepository<Nota, Integer> {

    @Query("""
        SELECT AVG(n.nota)
        FROM Nota n
        WHERE n.avistamiento.id = :avistamientoId
        """)
    Double obtenerPromedio(
        @Param("avistamientoId") Integer avistamientoId
    );
}

