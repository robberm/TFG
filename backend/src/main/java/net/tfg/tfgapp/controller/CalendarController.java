package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.events.EventRequest;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.AdminUser;
import net.tfg.tfgapp.domains.PersonalUser;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.exception.ApiException;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.EventService;
import net.tfg.tfgapp.service.UserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("events")
public class CalendarController {

    private final EventService eventService;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public CalendarController(EventService eventService, JwtUtil jwtUtil, UserService userService) {
        this.eventService = eventService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @GetMapping("/range")
    public ResponseEntity<?> getEventsBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(required = false) Long targetUserId,
            @RequestHeader("Authorization") String token) {

        User actor = getActor(token);

        if (actor.isAdmin()) {
            if (targetUserId != null) {
                User target = userService.getUserById(targetUserId);
                if (!canAccessManagedUser(actor, target)) {
                    throw new SecurityException("No tienes permiso sobre ese usuario.");
                }
                return ResponseEntity.ok(eventService.findAssignedEventsForAdminAndUserInRange(actor.getId(), targetUserId, start, end));
            }

            return ResponseEntity.ok(eventService.findAssignedEventsForAdminInRange(actor.getId(), start, end));
        }

        return ResponseEntity.ok(eventService.findEventsByUserAndDateRange(actor.getUsername(), start, end));
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody EventRequest request,
                                         @RequestHeader("Authorization") String token) {
        User actor = getActor(token);

        validateEventDates(request);
        List<PersonalUser> targets = resolveTargetUsers(actor, request);
        Event event = new Event();
        eventService.applyEventDetails(event, request);
        AdminUser assigningAdmin = actor.isAdmin() ? (AdminUser) actor : null;
        targets.forEach(target -> event.addAssignment(target, assigningAdmin));

        return ResponseEntity.status(HttpStatus.CREATED).body(List.of(eventService.save(event)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id,
                                         @RequestBody EventRequest eventDetails,
                                         @RequestHeader("Authorization") String token) {
        User actor = getActor(token);
        Optional<Event> existingEvent = eventService.getEventById(id);

        if (existingEvent.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado.");
        }

        if (!canAccessEvent(actor, existingEvent.get())) {
            throw new SecurityException("No tienes permiso para actualizar este evento.");
        }

        if (!actor.isAdmin() && existingEvent.get().getAssignedByAdmin() != null) {
            throw new SecurityException("No puedes modificar eventos asignados por administrador.");
        }

        validateEventDates(eventDetails);

        if (actor.isAdmin() && existingEvent.get().getAssignedByAdmin() != null) {
            List<PersonalUser> targets = resolveTargetUsers(actor, eventDetails);
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("Debes seleccionar al menos un usuario.");
            }

            existingEvent.get().replaceAssignments(targets, (AdminUser) actor);
            eventService.applyEventDetails(existingEvent.get(), eventDetails);
            return ResponseEntity.ok(eventService.save(existingEvent.get()));
        }

        Optional<Event> updatedEvent = eventService.updateEventById(id, eventDetails);
        return updatedEvent.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Evento no encontrado."
                ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id,
                                         @RequestHeader("Authorization") String token) {
        User actor = getActor(token);
        Optional<Event> existingEvent = eventService.getEventById(id);

        if (existingEvent.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado.");
        }

        if (!canAccessEvent(actor, existingEvent.get())) {
            throw new SecurityException("No tienes permiso para eliminar este evento.");
        }

        if (!actor.isAdmin() && existingEvent.get().getAssignedByAdmin() != null) {
            throw new SecurityException("No puedes eliminar eventos asignados por administrador.");
        }

        if (actor.isAdmin()) {
            eventService.deleteAdminAssignedEventCascade(actor.getId(), existingEvent.get());
        } else {
            eventService.deleteEventById(id);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(eventService.getCategories());
    }

    private User getActor(String token) {
        String tokenF = token.replace("Bearer ", "").trim();
        String username = jwtUtil.extractUsername(tokenF);
        User actor = userService.getUserByUsername(username);
        if (actor == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Usuario no encontrado.");
        }
        return actor;
    }

    private void validateEventDates(EventRequest request) {
        if (request.getEndTime() == null || request.getStartTime() == null || !request.getEndTime().isAfter(request.getStartTime())) {
            throw new DateTimeException("La fecha de inicio/fin no es correcta.");
        }
    }

    private List<PersonalUser> resolveTargetUsers(User actor, EventRequest request) {
        if (!actor.isAdmin()) {
            return actor instanceof PersonalUser personalActor ? List.of(personalActor) : List.of();
        }

        if (Boolean.TRUE.equals(request.getAssignToAllUsers())) {
            List<PersonalUser> allUsers = userService.getUsersInAdminScope(actor).stream()
                    .filter(PersonalUser.class::isInstance)
                    .map(PersonalUser.class::cast)
                    .toList();
            if (allUsers.isEmpty()) {
                throw new SecurityException("No hay usuarios subordinados para asignar.");
            }
            return allUsers;
        }

        if (request.getTargetUserIds() != null && !request.getTargetUserIds().isEmpty()) {
            return request.getTargetUserIds().stream()
                    .map(userService::getUserById)
                    .filter(PersonalUser.class::isInstance)
                    .map(PersonalUser.class::cast)
                    .peek(user -> {
                        if (!canAccessManagedUser(actor, user)) {
                            throw new SecurityException("No tienes permiso para operar sobre uno de los usuarios seleccionados.");
                        }
                    })
                    .distinct()
                    .toList();
        }

        if (request.getTargetUserId() != null) {
            User managedUser = userService.getUserById(request.getTargetUserId());
            if (!canAccessManagedUser(actor, managedUser)) {
                throw new SecurityException("No tienes permiso para operar sobre ese usuario.");
            }
            return managedUser instanceof PersonalUser personalUser ? List.of(personalUser) : List.of();
        }

        throw new SecurityException("Debes seleccionar al menos un usuario.");
    }

    private boolean canAccessManagedUser(User actor, User target) {
        if (target == null || !actor.isAdmin()) {
            return false;
        }

        return userService.getUsersInAdminScope(actor).stream()
                .anyMatch(user -> user.getId().equals(target.getId()));
    }

    private boolean canAccessEvent(User actor, Event event) {
        if (event.getAssignments().stream().anyMatch(a -> a.getPersonalUser().getId().equals(actor.getId()))) {
            return true;
        }

        return actor.isAdmin()
                && event.getAssignments().stream().anyMatch(a -> a.getAssignedByAdmin() != null
                && a.getAssignedByAdmin().getId().equals(actor.getId())
                && canAccessManagedUser(actor, a.getPersonalUser()));
    }
}
