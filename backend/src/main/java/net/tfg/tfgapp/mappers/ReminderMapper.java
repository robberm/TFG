package net.tfg.tfgapp.mappers;

import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.DTOs.reminders.ReminderDTO;
import org.springframework.stereotype.Component;

@Component
public class ReminderMapper {

    /**
     * Convierte un evento al DTO de reminder que se enviará al frontend.
     *
     * @param event evento origen
     * @return dto del reminder
     */
    public ReminderDTO toDto(Event event) {
        ReminderDTO dto = new ReminderDTO();
        dto.setEventId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setLocation(event.getLocation());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setAllDay(Boolean.TRUE.equals(event.getIsAllDay()));
        dto.setReminderMinutesBefore(event.getReminderMinutesBefore());
        dto.setCategory(event.getCategory() != null ? event.getCategory().name() : null);
        return dto;
    }
}
