package net.tfg.tfgapp.domains;



import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

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

@ManyToOne
@JoinColumn(name = "user_id")
private User user;

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



