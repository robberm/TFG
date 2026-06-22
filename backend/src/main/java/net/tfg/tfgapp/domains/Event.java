package net.tfg.tfgapp.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = false)
    private String title;
    @Column(unique = false)
    private String description;
    @Column(unique = false)
    private LocalDateTime startTime;
    @Column(unique = false)
    private LocalDateTime endTime;
    @Column(unique = false)
    private String location;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventCategory category;
    @Column(unique = false)
    private Boolean isAllDay;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "EventsReminders", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "minutes_before")
    private List<Integer> reminderMinutesBeforeList = new ArrayList<>();

    /** Legacy temporal para migración; se deriva de currentAssignment/asignación representativa. */
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "user_id")
    private PersonalUser user;

    /** Legacy temporal para migración; se deriva de currentAssignment/asignación representativa. */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_admin_id")
    private AdminUser assignedByAdmin;

    @JsonIgnore
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventAssignment> assignments = new ArrayList<>();

    @Transient
    @JsonIgnore
    private EventAssignment currentAssignment;

    public Event(Long id, String title, String description, LocalDateTime startTime, LocalDateTime endTime, String location, EventCategory category, Boolean isAllDay, List<Integer> reminderMinutesBeforeList, PersonalUser user) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
        this.category = category;
        this.isAllDay = isAllDay;
        this.reminderMinutesBeforeList = reminderMinutesBeforeList != null ? reminderMinutesBeforeList : new ArrayList<>();
        this.user = user;
        if (user != null) addAssignment(user, null);
    }

    public Event() {
    }

    public void addAssignment(PersonalUser target, AdminUser admin) {
        if (target == null) return;
        EventAssignment assignment = new EventAssignment();
        assignment.setEvent(this);
        assignment.setPersonalUser(target);
        assignment.setAssignedByAdmin(admin);
        assignments.add(assignment);
        if (currentAssignment == null) currentAssignment = assignment;
        if (user == null) user = target;
        if (assignedByAdmin == null) assignedByAdmin = admin;
    }

    public void replaceAssignments(List<PersonalUser> targets, AdminUser admin) {
        assignments.clear();
        currentAssignment = null;
        user = targets == null || targets.isEmpty() ? null : targets.get(0);
        assignedByAdmin = admin;
        if (targets != null) {
            for (PersonalUser target : targets) {
                addAssignment(target, admin);
            }
        }
    }

    private EventAssignment representativeAssignment() {
        if (currentAssignment != null) return currentAssignment;
        return assignments.isEmpty() ? null : assignments.get(0);
    }

    public PersonalUser getUser() {
        EventAssignment assignment = representativeAssignment();
        return assignment != null ? assignment.getPersonalUser() : user;
    }

    public AdminUser getAssignedByAdmin() {
        EventAssignment assignment = representativeAssignment();
        return assignment != null ? assignment.getAssignedByAdmin() : assignedByAdmin;
    }

    @JsonProperty("assignedByAdmin")
    public boolean isAssignedByAdmin() {
        return getAssignedByAdmin() != null;
    }

    @JsonProperty("assignedByAdminUsername")
    public String getAssignedByAdminUsername() {
        AdminUser admin = getAssignedByAdmin();
        return admin != null ? admin.getUsername() : null;
    }

    @JsonProperty("assignedToUsername")
    public String getAssignedToUsername() {
        PersonalUser assignedUser = getUser();
        return assignedUser != null ? assignedUser.getUsername() : null;
    }

    @JsonProperty("assignedToUserId")
    public Long getAssignedToUserId() {
        PersonalUser assignedUser = getUser();
        return assignedUser != null ? assignedUser.getId() : null;
    }

    public enum EventCategory {
        WORK("Work"), PERSONAL("Personal"), STUDY("Study"), HEALTH("Health"), MANDATORY("Mandatory"), FOCUS("Focus");

        private final String label;

        EventCategory(String label) { this.label = label; }

        public String getLabel() { return label; }
    }
}
