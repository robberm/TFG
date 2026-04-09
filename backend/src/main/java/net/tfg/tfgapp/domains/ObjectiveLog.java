package net.tfg.tfgapp.domains;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
        name = "objective_logs",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"objective_id", "log_date"})
        }
)
public class ObjectiveLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Objetivo al que pertenece el registro histórico.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objective_id", nullable = false)
    private Objective objective;

    /**
     * Fecha funcional del registro.
     */
    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    /**
     * Indica si el hábito fue completado en una fecha concreta.
     * Se utiliza principalmente para Habit.
     */
    @Column(nullable = true)
    private Boolean completed;

    /**
     * Valor de progreso registrado en una fecha concreta.
     * Se utiliza principalmente para Goal.
     */
    @Column(nullable = true)
    private Double progressValue;

    /**
     * Comentario opcional asociado al log.
     */
    @Column(nullable = true)
    private String notes;

    /**
     * Fecha real de creación del registro.
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}