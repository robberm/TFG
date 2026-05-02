package net.tfg.tfgapp.domains;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import net.tfg.tfgapp.enumerates.GoalStatus;
import net.tfg.tfgapp.enumerates.ObjectivePriority;

@Getter
@Setter
@Entity
@Table(name = "goals")
@DiscriminatorValue("GOAL")
public class Goal extends Objective {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ObjectivePriority priority = ObjectivePriority.Media;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoalStatus status = GoalStatus.NotStarted;

    /**
     * Compatibilidad con esquemas existentes:
     * algunas BBDD tienen también `is_numeric` en la tabla `goals` (además de `objectives`).
     * Mantenemos esta columna sincronizada para evitar errores SQL por columna NOT NULL sin default.
     */
    @Column(name = "is_numeric", nullable = false)
    private Boolean goalNumeric = false;

    @Column(nullable = true)
    private Double valorProgreso;

    @Column(nullable = true)
    private Double valorObjetivo;

    @PrePersist
    @PreUpdate
    private void syncGoalNumericColumn() {
        this.goalNumeric = isNumeric();
    }
}
