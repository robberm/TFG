package net.tfg.tfgapp.DTOs.objectives;

import lombok.Getter;
import lombok.Setter;
import net.tfg.tfgapp.enumerates.ObjectivePriority;

@Getter
@Setter
public class HabitRequest {

    private String titulo;
    private String description;
    private ObjectivePriority priority;
    private Boolean active;
}