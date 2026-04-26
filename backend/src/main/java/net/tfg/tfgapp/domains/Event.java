package net.tfg.tfgapp.domains;



import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

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
@Column(unique = false)
private Integer reminderMinutesBefore;

@ElementCollection(fetch = FetchType.EAGER)
@CollectionTable(name = "event_reminder_offsets", joinColumns = @JoinColumn(name = "event_id"))
@Column(name = "minutes_before")
private List<Integer> reminderMinutesBeforeList = new ArrayList<>();

@Column(unique = false)
private String assignmentBatchId;

@ManyToOne
@JoinColumn(name = "user_id")
private User user;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "assigned_by_admin_id")
@JsonIgnore
private User assignedByAdmin;


    public Event(Long id, String title, String description, LocalDateTime startTime, LocalDateTime endTime, String location, EventCategory category, Boolean isAllDay, Integer reminderMinutesBefore, User user) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
        this.category = category;
        this.isAllDay = isAllDay;
        this.reminderMinutesBefore = reminderMinutesBefore;
        this.user = user;
    }

    public Event() {
    }



    @JsonProperty("assignedByAdmin")
    public boolean isAssignedByAdmin() {
        return assignedByAdmin != null;
    }

    @JsonProperty("assignedByAdminUsername")
    public String getAssignedByAdminUsername() {
        return assignedByAdmin != null ? assignedByAdmin.getUsername() : null;
    }

    @JsonProperty("assignedToUsername")
    public String getAssignedToUsername() {
        return user != null ? user.getUsername() : null;
    }

    @JsonProperty("assignedToUserId")
    public Long getAssignedToUserId() {
        return user != null ? user.getId() : null;
    }

    public enum EventCategory {
        WORK("Work"),
        PERSONAL("Personal"),
        STUDY("Study"),
        HEALTH("Health"),
        MANDATORY("Mandatory");

        


        private final String label;

        EventCategory(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}
