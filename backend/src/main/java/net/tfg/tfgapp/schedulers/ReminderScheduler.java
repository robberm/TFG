package net.tfg.tfgapp.schedulers;

import net.tfg.tfgapp.components.SessionStore;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.repos.EventRepo;
import net.tfg.tfgapp.mappers.ReminderMapper;
import net.tfg.tfgapp.service.ReminderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Component
public class ReminderScheduler {

    /**
     * Tareas activas indexadas por id de evento.
     */
    private final Map<Long, ScheduledFuture<?>> scheduledReminders = new ConcurrentHashMap<>();

    @Autowired
    private TaskScheduler reminderTaskScheduler;

    @Autowired
    private EventRepo eventRepo;

    @Autowired
    private ReminderService reminderService;

    @Autowired
    private ReminderMapper reminderMapper;

    @Autowired
    private SessionStore sessionStore;

    /**
     * Programa al arrancar la aplicación todos los reminders futuros pendientes.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void schedulePendingRemindersOnStartup() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> eventsWithReminder = eventRepo.findPendingReminders(now);

        for (Event event : eventsWithReminder) {
            scheduleReminder(event);
        }
    }

    /**
     * Programa el reminder de un evento si tiene configuración válida.
     *
     * @param event evento a programar
     */
    public void scheduleReminder(Event event) {
        if (!isSchedulable(event)) {
            cancelReminder(event.getId());
            return;
        }

        cancelReminder(event.getId());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime triggerTime = event.getStartTime().minusMinutes(event.getReminderMinutesBefore());

        Date executionDate = triggerTime.isAfter(now)
                ? toDate(triggerTime)
                : new Date(System.currentTimeMillis() + 1000);

        ScheduledFuture<?> scheduledFuture = reminderTaskScheduler.schedule(
                () -> executeReminder(event),
                executionDate
        );

        scheduledReminders.put(event.getId(), scheduledFuture);
    }

    /**
     * Reprograma el reminder de un evento tras una modificación.
     *
     * @param event evento actualizado
     */
    public void rescheduleReminder(Event event) {
        scheduleReminder(event);
    }

    /**
     * Cancela la tarea asociada a un evento si existe.
     *
     * @param eventId id del evento
     */
    public void cancelReminder(Long eventId) {
        if (eventId == null) {
            return;
        }

        ScheduledFuture<?> scheduledFuture = scheduledReminders.remove(eventId);

        if (scheduledFuture != null) {
            scheduledFuture.cancel(false);
        }
    }

    /**
     * Ejecuta el reminder de un evento si el usuario autenticado coincide con el propietario.
     *
     * @param event evento cuyo reminder debe enviarse
     */
    private void executeReminder(Event event) {
        try {
            if (event == null || event.getId() == null || event.getUser() == null) {
                return;
            }

            Long loggedUserId = sessionStore.getLoggedUserId();

            if (loggedUserId == null || !loggedUserId.equals(event.getUser().getId())) {
                return;
            }

            reminderService.sendReminder(reminderMapper.toDto(event));
        } finally {
            if (event != null && event.getId() != null) {
                scheduledReminders.remove(event.getId());
            }
        }
    }

    /**
     * Comprueba si un evento tiene los datos mínimos para poder planificar su reminder.
     *
     * @param event evento a validar
     * @return true si es programable
     */
    private boolean isSchedulable(Event event) {
        return event != null
                && event.getId() != null
                && event.getStartTime() != null
                && event.getEndTime() != null
                && event.getReminderMinutesBefore() != null
                && event.getEndTime().isAfter(LocalDateTime.now());
    }

    /**
     * Convierte un LocalDateTime a Date usando la zona horaria del sistema.
     *
     * @param dateTime fecha a convertir
     * @return fecha convertida
     */
    private Date toDate(LocalDateTime dateTime) {
        return Date.from(dateTime.atZone(ZoneId.systemDefault()).toInstant());
    }
}
