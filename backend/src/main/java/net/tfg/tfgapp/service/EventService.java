package net.tfg.tfgapp.service;

import jakarta.persistence.EntityNotFoundException;
import net.tfg.tfgapp.components.SessionStore;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.repos.EventRepo;
import net.tfg.tfgapp.schedulers.ReminderScheduler;
import net.tfg.tfgapp.utils.WindowsUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
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

    /**
     * Obtiene los eventos de un usuario que se solapan con el rango indicado.
     *
     * @param username username del usuario
     * @param start fecha de inicio del rango
     * @param end fecha de fin del rango
     * @return lista de eventos del usuario para dicho rango
     */
    public List<Event> findEventsByUserAndDateRange(String username, LocalDateTime start, LocalDateTime end) {
        return eventRepo.findEventsByUserAndDateRange(username, start, end);
    }

    /**
     * Obtiene todos los eventos de un usuario.
     *
     * @param username username del usuario
     * @return lista de eventos del usuario
     */
    public List<Event> getEventsByUsername(String username) {
        return eventRepo.findEventsByUser(username);
    }

    /**
     * Actualiza un evento existente por su identificador.
     *
     * @param id id del evento a actualizar
     * @param eventDetails datos nuevos del evento
     * @return optional con el evento actualizado si existe
     */
    public Optional<Event> updateEventById(Long id, Event eventDetails) {
        Optional<Event> eventOptional = getEventById(id);

        if (eventOptional.isPresent()) {
            Event existingEvent = eventOptional.get();
            existingEvent.setTitle(eventDetails.getTitle());
            existingEvent.setDescription(eventDetails.getDescription());
            existingEvent.setStartTime(eventDetails.getStartTime());
            existingEvent.setEndTime(eventDetails.getEndTime());
            existingEvent.setLocation(eventDetails.getLocation());
            existingEvent.setCategory(eventDetails.getCategory());
            existingEvent.setIsAllDay(eventDetails.getIsAllDay());
            existingEvent.setReminderMinutesBefore(eventDetails.getReminderMinutesBefore());

            Event updatedEvent = eventRepo.save(existingEvent);
            reminderScheduler.rescheduleReminder(updatedEvent);
            return Optional.of(updatedEvent);
        }

        return Optional.empty();
    }

    /**
     * Obtiene un evento por su id.
     *
     * @param id id del evento
     * @return optional con el evento si existe
     */
    public Optional<Event> getEventById(Long id) {
        return eventRepo.findById(id);
    }

    /**
     * Elimina un evento por su id.
     *
     * @param id id del evento a eliminar
     */
    public void deleteEventById(Long id) {
        Optional<Event> eventOptional = eventRepo.findById(id);

        if (eventOptional.isEmpty()) {
            throw new EntityNotFoundException("Event with ID " + id + " not found.");
        }

        reminderScheduler.cancelReminder(id);
        eventRepo.deleteById(id);
    }

    /**
     * Obtiene todos los eventos registrados.
     *
     * @return lista completa de eventos
     */
    public List<Event> findAll() {
        return eventRepo.findAll();
    }

    /**
     * Comprueba si un usuario tiene actualmente activa una categoría de evento.
     *
     * @param category nombre de la categoría
     * @param userId id del usuario autenticado
     * @return true si la categoría está activa ahora mismo
     */
    private boolean isEventCategoryActive(String category, Long userId) {
        Event.EventCategory eventCategory = Event.EventCategory.valueOf(category);
        return eventRepo.existsActiveEventOfCategory(eventCategory, LocalDateTime.now(), userId);
    }

    /**
     * Devuelve todas las categorías disponibles del enumerado de eventos.
     *
     * @return lista de nombres de categoría
     */
    public List<String> getCategories() {
        return Arrays.stream(Event.EventCategory.values())
                .map(Enum::name)
                .toList();
    }

    /**
     * Revisa periódicamente si el usuario actual tiene activa una categoría bloqueante
     * y, en ese caso, fuerza el apagado del sistema.
     */
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