package net.tfg.tfgapp.domains;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @Column(nullable = false)
    @JsonProperty("isNumeric")
    private boolean isNumeric = false;

    @Column(nullable = true)
    private Double valorProgreso;

    @Column(nullable = true)
    private Double valorObjetivo;
}