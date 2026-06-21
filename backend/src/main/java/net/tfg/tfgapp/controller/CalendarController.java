package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.events.EventRequest;
import net.tfg.tfgapp.domains.AdminUser;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.EventAssignment;
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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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

        User currentUser = getCurrentUser(token);

        if (currentUser.isAdmin()) {
            if (targetUserId != null) {
                User target = userService.getUserById(targetUserId);
                if (!canAccessManagedUser(currentUser, target)) {
                    throw new SecurityException("No tienes permiso sobre ese usuario.");
                }
                return ResponseEntity.ok(eventService.findAssignedEventsForAdminAndUserInRange(currentUser.getId(), targetUserId, start, end));
            }

            return ResponseEntity.ok(eventService.findAssignedEventsForAdminInRange(currentUser.getId(), start, end));
        }

        return ResponseEntity.ok(eventService.findEventsByUserAndDateRange(currentUser.getUsername(), start, end));
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody EventRequest request,
                                         @RequestHeader("Authorization") String token) {
        User currentUser = getCurrentUser(token);

        validateEventDates(request);
        List<PersonalUser> targets = resolveTargetUsers(currentUser, request);
        Event event = new Event();
        eventService.applyEventDetails(event, request);
        AdminUser assigningAdmin = currentUser.isAdmin() ? (AdminUser) currentUser : null;
        for (PersonalUser target : targets) {
            event.addAssignment(target, assigningAdmin);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(List.of(eventService.save(event)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id,
                                         @RequestBody EventRequest eventDetails,
                                         @RequestHeader("Authorization") String token) {
        User currentUser = getCurrentUser(token);
        Optional<Event> existingEvent = eventService.getEventById(id);

        if (existingEvent.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado.");
        }

        Event event = existingEvent.get();
        if (!canAccessEvent(currentUser, event)) {
            throw new SecurityException("No tienes permiso para actualizar este evento.");
        }

        if (!currentUser.isAdmin() && event.getAssignedByAdmin() != null) {
            throw new SecurityException("No puedes modificar eventos asignados por administrador.");
        }

        validateEventDates(eventDetails);

        if (currentUser.isAdmin() && event.getAssignedByAdmin() != null) {
            List<PersonalUser> targets = resolveTargetUsers(currentUser, eventDetails);
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("Debes seleccionar al menos un usuario.");
            }

            event.replaceAssignments(targets, (AdminUser) currentUser);
            eventService.applyEventDetails(event, eventDetails);
            return ResponseEntity.ok(eventService.save(event));
        }

        Optional<Event> updatedEvent = eventService.updateEventById(id, eventDetails);
        if (updatedEvent.isPresent()) {
            return ResponseEntity.ok(updatedEvent.get());
        }
        throw new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id,
                                         @RequestHeader("Authorization") String token) {
        User currentUser = getCurrentUser(token);
        Optional<Event> existingEvent = eventService.getEventById(id);

        if (existingEvent.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Evento no encontrado.");
        }

        Event event = existingEvent.get();
        if (!canAccessEvent(currentUser, event)) {
            throw new SecurityException("No tienes permiso para eliminar este evento.");
        }

        if (!currentUser.isAdmin() && event.getAssignedByAdmin() != null) {
            throw new SecurityException("No puedes eliminar eventos asignados por administrador.");
        }

        if (currentUser.isAdmin()) {
            eventService.deleteAdminAssignedEventCascade(currentUser.getId(), event);
        } else {
            eventService.deleteEventById(id);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        return ResponseEntity.ok(eventService.getCategories());
    }

    private User getCurrentUser(String authorizationHeader) {
        String username = jwtUtil.extractUsernameFromAuthorizationHeader(authorizationHeader);
        User currentUser = userService.getUserByUsername(username);
        if (currentUser == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Usuario no encontrado.");
        }
        return currentUser;
    }

    private void validateEventDates(EventRequest request) {
        if (request.getEndTime() == null || request.getStartTime() == null || !request.getEndTime().isAfter(request.getStartTime())) {
            throw new DateTimeException("La fecha de inicio/fin no es correcta.");
        }
    }

    private List<PersonalUser> resolveTargetUsers(User currentUser, EventRequest request) {
        if (!currentUser.isAdmin()) {
            return currentUser instanceof PersonalUser personalUser ? List.of(personalUser) : List.of();
        }

        if (Boolean.TRUE.equals(request.getAssignToAllUsers())) {
            List<PersonalUser> allUsers = new ArrayList<>();
            for (User scopedUser : userService.getUsersInAdminScope(currentUser)) {
                if (scopedUser instanceof PersonalUser personalUser) {
                    allUsers.add(personalUser);
                }
            }
            if (allUsers.isEmpty()) {
                throw new SecurityException("No hay usuarios subordinados para asignar.");
            }
            return allUsers;
        }

        if (request.getTargetUserIds() != null && !request.getTargetUserIds().isEmpty()) {
            List<PersonalUser> targets = new ArrayList<>();
            Set<Long> uniqueTargetIds = new HashSet<>();
            for (Long targetUserId : request.getTargetUserIds()) {
                User user = userService.getUserById(targetUserId);
                if (!(user instanceof PersonalUser personalUser)) {
                    continue;
                }
                if (!canAccessManagedUser(currentUser, personalUser)) {
                    throw new SecurityException("No tienes permiso para operar sobre uno de los usuarios seleccionados.");
                }
                if (uniqueTargetIds.add(personalUser.getId())) {
                    targets.add(personalUser);
                }
            }
            return targets;
        }

        if (request.getTargetUserId() != null) {
            User managedUser = userService.getUserById(request.getTargetUserId());
            if (!canAccessManagedUser(currentUser, managedUser)) {
                throw new SecurityException("No tienes permiso para operar sobre ese usuario.");
            }
            return managedUser instanceof PersonalUser personalUser ? List.of(personalUser) : List.of();
        }

        throw new SecurityException("Debes seleccionar al menos un usuario.");
    }

    private boolean canAccessManagedUser(User currentUser, User target) {
        if (target == null || currentUser == null || !currentUser.isAdmin()) {
            return false;
        }

        for (User scopedUser : userService.getUsersInAdminScope(currentUser)) {
            if (scopedUser.getId().equals(target.getId())) {
                return true;
            }
        }
        return false;
    }

    private boolean canAccessEvent(User currentUser, Event event) {
        for (EventAssignment assignment : event.getAssignments()) {
            if (assignment.getPersonalUser().getId().equals(currentUser.getId())) {
                return true;
            }
        }

        if (!currentUser.isAdmin()) {
            return false;
        }

        for (EventAssignment assignment : event.getAssignments()) {
            if (assignment.getAssignedByAdmin() != null
                    && assignment.getAssignedByAdmin().getId().equals(currentUser.getId())
                    && canAccessManagedUser(currentUser, assignment.getPersonalUser())) {
                return true;
            }
        }
        return false;
    }
}
