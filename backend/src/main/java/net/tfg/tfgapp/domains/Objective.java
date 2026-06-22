package net.tfg.tfgapp.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "objectives")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "objective_type")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public abstract class Objective {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "aud_tim", nullable = false, updatable = false)
    private LocalDateTime audTim;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private PersonalUser user;



    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_admin_id")
    private AdminUser assignedByAdmin;

    @JsonIgnore
    @OneToMany(mappedBy = "objective", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ObjectiveLog> logs = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "objective", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ObjectiveAssignment> assignments = new ArrayList<>();

    @Transient
    @JsonIgnore
    private ObjectiveAssignment currentAssignment;

    @JsonIgnore
    @Column(name = "is_numeric", nullable = false)
    private Boolean numeric = false;

    @JsonProperty("isNumeric")
    public boolean isNumeric() {
        return Boolean.TRUE.equals(numeric);
    }

    @JsonProperty("isNumeric")
    public void setNumeric(boolean numeric) {
        this.numeric = numeric;
    }

    private ObjectiveAssignment representativeAssignment() {
        if (currentAssignment != null) {
            return currentAssignment;
        }
        return assignments.isEmpty() ? null : assignments.get(0);
    }

    public PersonalUser getEffectiveUser() {
        ObjectiveAssignment assignment = representativeAssignment();
        return assignment != null ? assignment.getPersonalUser() : user;
    }

    public AdminUser getEffectiveAssignedByAdmin() {
        ObjectiveAssignment assignment = representativeAssignment();
        return assignment != null ? assignment.getAssignedByAdmin() : assignedByAdmin;
    }

    public void addAssignment(PersonalUser target, AdminUser admin) {
        if (target == null) {
            return;
        }
        ObjectiveAssignment assignment = new ObjectiveAssignment();
        assignment.setObjective(this);
        assignment.setPersonalUser(target);
        assignment.setAssignedByAdmin(admin);
        assignment.setActive(active == null || active);
        if (this instanceof Goal goal) {
            assignment.setStatus(goal.getStatus());
            assignment.setProgressValue(goal.getValorProgreso());
            assignment.setTargetValue(goal.getValorObjetivo());
        }
        assignments.add(assignment);
        if (currentAssignment == null) {
            currentAssignment = assignment;
        }
        if (user == null) {
            user = target;
        }
        if (assignedByAdmin == null) {
            assignedByAdmin = admin;
        }
    }

    @JsonProperty("assignedByAdmin")
    public boolean isAssignedByAdmin() {
        return getEffectiveAssignedByAdmin() != null;
    }

    @JsonProperty("assignedByAdminUsername")
    public String getAssignedByAdminUsername() {
        AdminUser admin = getEffectiveAssignedByAdmin();
        return admin != null ? admin.getUsername() : null;
    }

    @JsonProperty("assignedToUsername")
    public String getAssignedToUsername() {
        PersonalUser assignedUser = getEffectiveUser();
        return assignedUser != null ? assignedUser.getUsername() : null;
    }

    @JsonProperty("assignedToUserId")
    public Long getAssignedToUserId() {
        PersonalUser assignedUser = getEffectiveUser();
        return assignedUser != null ? assignedUser.getId() : null;
    }

    @PrePersist
    public void onCreate() {
        this.audTim = LocalDateTime.now();

        if (this.active == null) {
            this.active = true;
        }
        if (this.numeric == null) {
            this.numeric = false;
        }
    }
}
