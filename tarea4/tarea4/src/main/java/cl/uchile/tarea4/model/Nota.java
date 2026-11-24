package cl.uchile.tarea4.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;

@Entity
@Table(name = "nota")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nota", nullable = false)
    private Integer nota;

    @ManyToOne
    @JoinColumn(name = "avistamiento_id", nullable = false)
    private Avistamiento avistamiento;

    public Nota() {
    }

    public Nota(Integer nota, Avistamiento avistamiento) {
        this.nota = nota;
        this.avistamiento = avistamiento;
    }

    public Integer getId() {
        return id;
    }

    public Integer getNota() {
        return nota;
    }

    public Avistamiento getAvistamiento() {
        return avistamiento;
    }
}
