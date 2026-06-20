package net.tfg.tfgapp.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Asignación individual de un evento a un usuario personal.
 *
 * Esta tabla evita duplicar la fila de EVENTS cuando un administrador asigna
 * el mismo evento a varios usuarios: el evento queda como definición común y
 * aquí queda la trazabilidad de cada usuario asignado y del admin que lo hizo.
 */
@Getter
@Setter
@Entity
@Table(
        name = "event_assignments",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"event_id", "personal_user_id"})
        }
)
public class EventAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personal_user_id", nullable = false)
    private PersonalUser personalUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_admin_id")
    private AdminUser assignedByAdmin;

    @Column(nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @PrePersist
    public void onCreate() {
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }
    }
}
