package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.events.EventRequest;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.enumerates.UserRole;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.EventService;
import net.tfg.tfgapp.service.UserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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

        if (actor == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
        }

        if (actor.getRole() == UserRole.ADMIN) {
            if (targetUserId != null) {
                User target = userService.getUserById(targetUserId);
                if (!canAccessManagedUser(actor, target)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso sobre ese usuario.");
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
        try {
            User actor = getActor(token);

            if (actor == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
            }

            validateEventDates(request);
            List<User> targets = resolveTargetUsers(actor, request);
            String assignmentBatchId =
                    actor.getRole() == UserRole.ADMIN && targets.size() > 1
                            ? UUID.randomUUID().toString()
                            : null;

            List<Event> created = new ArrayList<>();
            for (User target : targets) {
                Event event = new Event();
                eventService.applyEventDetails(event, request);
                event.setUser(target);
                event.setAssignmentBatchId(assignmentBatchId);

                if (actor.getRole() == UserRole.ADMIN) {
                    event.setAssignedByAdmin(actor);
                }

                created.add(eventService.save(event));
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (DateTimeException e) {
            return ResponseEntity.badRequest().body("Hubo un fallo al crear el evento: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id,
                                         @RequestBody EventRequest eventDetails,
                                         @RequestHeader("Authorization") String token) {
        User actor = getActor(token);
        Optional<Event> existingEvent = eventService.getEventById(id);

        if (existingEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (actor == null || !canAccessEvent(actor, existingEvent.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para actualizar este evento.");
        }

        if (actor.getRole() != UserRole.ADMIN && existingEvent.get().getAssignedByAdmin() != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("No puedes modificar eventos asignados por administrador.");
        }

        try {
            validateEventDates(eventDetails);
            Optional<Event> updatedEvent = eventService.updateEventById(id, eventDetails);
            return updatedEvent.<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (DateTimeException e) {
            return ResponseEntity.badRequest().body("Hubo un fallo al actualizar el evento: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id,
                                         @RequestHeader("Authorization") String token) {
        User actor = getActor(token);
        Optional<Event> existingEvent = eventService.getEventById(id);

        if (existingEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (actor == null || !canAccessEvent(actor, existingEvent.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para eliminar este evento.");
        }

        if (actor.getRole() != UserRole.ADMIN && existingEvent.get().getAssignedByAdmin() != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("No puedes eliminar eventos asignados por administrador.");
        }

        eventService.deleteEventById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        try {
            return ResponseEntity.ok(eventService.getCategories());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching categories: " + e.getMessage());
        }
    }

    private User getActor(String token) {
        String tokenF = token.replace("Bearer ", "").trim();
        String username = jwtUtil.extractUsername(tokenF);
        return userService.getUserByUsername(username);
    }

    private void validateEventDates(EventRequest request) {
        if (request.getEndTime() == null || request.getStartTime() == null || !request.getEndTime().isAfter(request.getStartTime())) {
            throw new DateTimeException("Date is not correct");
        }
    }

    private List<User> resolveTargetUsers(User actor, EventRequest request) {
        if (actor.getRole() != UserRole.ADMIN) {
            return List.of(actor);
        }

        if (Boolean.TRUE.equals(request.getAssignToAllUsers())) {
            List<User> allUsers = userService.getUsersInAdminScope(actor);
            if (allUsers.isEmpty()) {
                throw new SecurityException("No hay usuarios subordinados para asignar.");
            }
            return allUsers;
        }

        if (request.getTargetUserIds() != null && !request.getTargetUserIds().isEmpty()) {
            return request.getTargetUserIds().stream()
                    .map(userService::getUserById)
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
            return List.of(managedUser);
        }

        throw new SecurityException("Debes seleccionar al menos un usuario.");
    }

    private boolean canAccessManagedUser(User actor, User target) {
        if (target == null || actor.getRole() != UserRole.ADMIN) {
            return false;
        }

        return userService.getUsersInAdminScope(actor).stream()
                .anyMatch(user -> user.getId().equals(target.getId()));
    }

    private boolean canAccessEvent(User actor, Event event) {
        if (event.getUser().getId().equals(actor.getId())) {
            return true;
        }

        return actor.getRole() == UserRole.ADMIN
                && event.getAssignedByAdmin() != null
                && event.getAssignedByAdmin().getId().equals(actor.getId())
                && canAccessManagedUser(actor, event.getUser());
    }
}
