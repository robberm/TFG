package net.tfg.tfgapp.service;

import jakarta.persistence.EntityNotFoundException;
import net.tfg.tfgapp.DTOs.events.EventRequest;
import net.tfg.tfgapp.components.SessionStore;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.repos.EventRepo;
import net.tfg.tfgapp.schedulers.ReminderScheduler;
import net.tfg.tfgapp.utils.WindowsUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    @Autowired
    public EventRepo eventRepo;

    @Autowired
    public SessionStore sessionStore;

    @Autowired
    private ReminderScheduler reminderScheduler;

    public <S extends Event> S save(S entity) {
        S savedEvent = eventRepo.save(entity);
        reminderScheduler.scheduleReminder(savedEvent);
        return savedEvent;
    }

    public List<Event> findEventsByUserAndDateRange(String username, LocalDateTime start, LocalDateTime end) {
        return eventRepo.findEventsByUserAndDateRange(username, start, end);
    }

    public List<Event> findAssignedEventsForAdminInRange(Long adminId, LocalDateTime start, LocalDateTime end) {
        return eventRepo.findAssignedEventsForAdminInRange(adminId, start, end);
    }

    public List<Event> findAssignedEventsForAdminAndUserInRange(Long adminId, Long userId, LocalDateTime start, LocalDateTime end) {
        return eventRepo.findAssignedEventsForAdminAndUserInRange(adminId, userId, start, end);
    }

    public List<Event> getEventsByUsername(String username) {
        return eventRepo.findEventsByUser(username);
    }

    public List<Event> getAssignedEventsForAdminAndUser(Long adminId, Long userId) {
        return eventRepo.findAssignedEventsForAdminAndUser(adminId, userId);
    }

    public List<Event> getAssignedEventsByBatch(Long adminId, String assignmentBatchId) {
        return eventRepo.findByAssignedByAdmin_IdAndAssignmentBatchId(adminId, assignmentBatchId);
    }

    public Optional<Event> updateEventById(Long id, EventRequest eventDetails) {
        Optional<Event> eventOptional = getEventById(id);

        if (eventOptional.isPresent()) {
            Event existingEvent = eventOptional.get();
            applyEventDetails(existingEvent, eventDetails);

            Event updatedEvent = eventRepo.save(existingEvent);
            reminderScheduler.rescheduleReminder(updatedEvent);
            return Optional.of(updatedEvent);
        }

        return Optional.empty();
    }

    public void applyEventDetails(Event target, EventRequest details) {
        target.setTitle(details.getTitle());
        target.setDescription(details.getDescription());
        target.setStartTime(details.getStartTime());
        target.setEndTime(details.getEndTime());
        target.setLocation(details.getLocation());
        target.setCategory(details.getCategory() != null ? details.getCategory() : Event.EventCategory.PERSONAL);
        target.setIsAllDay(details.getIsAllDay() != null ? details.getIsAllDay() : false);

        List<Integer> normalizedReminderOffsets = normalizeReminderOffsets(details.getReminderMinutesBeforeList(), details.getReminderMinutesBefore());
        target.setReminderMinutesBeforeList(normalizedReminderOffsets);
        target.setReminderMinutesBefore(normalizedReminderOffsets.isEmpty() ? null : normalizedReminderOffsets.get(0));
    }

    private List<Integer> normalizeReminderOffsets(List<Integer> reminderMinutesBeforeList, Integer legacyReminderMinutesBefore) {
        LinkedHashSet<Integer> normalized = new LinkedHashSet<>();

        if (reminderMinutesBeforeList != null) {
            reminderMinutesBeforeList.stream()
                    .filter(value -> value != null && value >= 0)
                    .forEach(normalized::add);
        }

        if (normalized.isEmpty() && legacyReminderMinutesBefore != null && legacyReminderMinutesBefore >= 0) {
            normalized.add(legacyReminderMinutesBefore);
        }

        return new ArrayList<>(normalized);
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepo.findById(id);
    }

    public void deleteEventById(Long id) {
        Optional<Event> eventOptional = eventRepo.findById(id);

        if (eventOptional.isEmpty()) {
            throw new EntityNotFoundException("Event with ID " + id + " not found.");
        }

        reminderScheduler.cancelReminder(id);
        eventRepo.deleteById(id);
    }

    public List<String> getCategories() {
        return Arrays.stream(Event.EventCategory.values())
                .map(Enum::name)
                .toList();
    }

    private boolean isEventCategoryActive(String category, Long userId) {
        Event.EventCategory eventCategory = Event.EventCategory.valueOf(category);
        return eventRepo.existsActiveEventOfCategory(eventCategory, LocalDateTime.now(), userId);
    }

    @Scheduled(fixedDelay = 5000)
    public void isEnforceShutdownCategory() {
        if (sessionStore == null) {
            return;
        }

        Long userId = sessionStore.getLoggedUserId();

        if (userId == null) {
            return;
        }

        if (isEventCategoryActive("MANDATORY", userId)) {
            WindowsUtils.shutdownSystem();
        }
    }
}
