package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.events.EventRequest;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.enumerates.UserRole;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.EventService;
import net.tfg.tfgapp.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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

    @GetMapping("/user/{username}")
    public ResponseEntity<?> getAllEvents(@PathVariable String username,
                                          @RequestHeader("Authorization") String token) {
        User actor = getActor(token);
        User owner = userService.getUserByUsername(username);

        if (actor == null || owner == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
        }

        List<Event> eventsList;
        if (actor.getId().equals(owner.getId())) {
            eventsList = eventService.getEventsByUsername(username);
        } else if (canAccessManagedUser(actor, owner)) {
            eventsList = eventService.getAssignedEventsForAdminAndUser(actor.getId(), owner.getId());
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para consultar estos eventos.");
        }

        if (eventsList.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No events found for user: " + username);
        }

        return ResponseEntity.ok(eventsList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id,
                                          @RequestHeader("Authorization") String token) {
        User actor = getActor(token);
        Optional<Event> event = eventService.getEventById(id);

        if (event.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (actor == null || !canAccessEvent(actor, event.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para acceder a este evento.");
        }

        return ResponseEntity.ok(event.get());
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
            String assignmentGroupId = actor.getRole() == UserRole.ADMIN ? UUID.randomUUID().toString() : null;

            List<Event> saved = new ArrayList<>();
            for (User target : targets) {
                Event event = new Event();
                eventService.applyEventDetails(event, request);
                event.setUser(target);
                if (actor.getRole() == UserRole.ADMIN) {
                    event.setAssignedByAdmin(actor);
                    event.setAssignmentGroupId(assignmentGroupId);
                }
                saved.add(eventService.save(event));
            }

            return new ResponseEntity<>(saved, HttpStatus.CREATED);

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

        try {
            validateEventDates(eventDetails);

            if (actor.getRole() == UserRole.ADMIN && existingEvent.get().getAssignedByAdmin() != null) {
                List<User> targets = resolveTargetUsers(actor, eventDetails, existingEvent.get().getUser());
                Event updatedReference = upsertAssignmentGroup(existingEvent.get(), eventDetails, actor, targets);
                return ResponseEntity.ok(updatedReference);
            }

            Optional<Event> updatedEvent = eventService.updateEventById(id, eventDetails);
            return updatedEvent.<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
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

        if (actor.getRole() == UserRole.ADMIN
                && existingEvent.get().getAssignedByAdmin() != null
                && existingEvent.get().getAssignmentGroupId() != null) {
            eventService.deleteAll(eventService.getEventsByAssignmentGroup(existingEvent.get().getAssignmentGroupId(), actor.getId()));
            return ResponseEntity.noContent().build();
        }

        eventService.deleteEventById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        try {
            List<String> categories = eventService.getCategories();
            return ResponseEntity.ok(categories);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching categories: " + e.getMessage());
        }
    }

    private Event upsertAssignmentGroup(Event existing,
                                        EventRequest details,
                                        User admin,
                                        List<User> targets) {
        String groupId = existing.getAssignmentGroupId() != null ? existing.getAssignmentGroupId() : UUID.randomUUID().toString();
        List<Event> grouped = eventService.getEventsByAssignmentGroup(groupId, admin.getId());
        if (grouped.isEmpty()) {
            existing.setAssignmentGroupId(groupId);
            grouped = List.of(existing);
        }

        Map<Long, Event> byUserId = grouped.stream().collect(Collectors.toMap(e -> e.getUser().getId(), e -> e, (a, b) -> a));
        Set<Long> targetIds = targets.stream().map(User::getId).collect(Collectors.toSet());

        List<Event> toDelete = grouped.stream()
                .filter(event -> !targetIds.contains(event.getUser().getId()))
                .toList();
        if (!toDelete.isEmpty()) {
            eventService.deleteAll(toDelete);
        }

        Event reference = null;
        for (User target : targets) {
            Event event = byUserId.get(target.getId());
            if (event == null) {
                event = new Event();
                event.setUser(target);
                event.setAssignedByAdmin(admin);
                event.setAssignmentGroupId(groupId);
            }
            eventService.applyEventDetails(event, details);
            Event saved = eventService.save(event);
            if (reference == null || saved.getId().equals(existing.getId())) {
                reference = saved;
            }
        }

        return reference;
    }

    private void validateEventDates(EventRequest request) {
        if (request.getEndTime() == null || request.getStartTime() == null || !request.getEndTime().isAfter(request.getStartTime())) {
            throw new DateTimeException("Date is not correct");
        }
    }

    private User getActor(String token) {
        String tokenF = token.replace("Bearer ", "").trim();
        String username = jwtUtil.extractUsername(tokenF);
        return userService.getUserByUsername(username);
    }

    private List<User> resolveTargetUsers(User actor, EventRequest request) {
        return resolveTargetUsers(actor, request, actor);
    }

    private List<User> resolveTargetUsers(User actor, EventRequest request, User fallbackDefault) {
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

        return List.of(fallbackDefault);
    }

    private boolean canAccessManagedUser(User actor, User owner) {
        if (owner == null || actor.getRole() != UserRole.ADMIN) {
            return false;
        }
        return userService.getUsersInAdminScope(actor).stream().anyMatch(user -> user.getId().equals(owner.getId()));
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
