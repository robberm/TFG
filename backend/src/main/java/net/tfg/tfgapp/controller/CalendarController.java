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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

        if (!canAccessUser(actor, owner)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para consultar estos eventos.");
        }

        List<Event> eventsList = eventService.getEventsByUsername(username);

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

        if (actor == null || !canAccessUser(actor, event.get().getUser())) {
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

        User owner;

        if (actor.getRole() == UserRole.ADMIN && targetUserId != null) {
            owner = userService.getManagedUser(actor.getId(), targetUserId);
            if (owner == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso sobre ese usuario.");
            }
        } else {
            owner = actor;
        }

        return ResponseEntity.ok(eventService.findEventsByUserAndDateRange(owner.getUsername(), start, end));
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody EventRequest request,
                                         @RequestHeader("Authorization") String token) {
        try {
            Map<String, String> response = new HashMap<>();
            User actor = getActor(token);

            if (actor == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
            }

            User owner = resolveTargetUser(actor, request.getTargetUserId());

            Event event = new Event();
            event.setTitle(request.getTitle());
            event.setDescription(request.getDescription());
            event.setStartTime(request.getStartTime());
            event.setEndTime(request.getEndTime());
            event.setLocation(request.getLocation());
            event.setCategory(request.getCategory());
            event.setIsAllDay(request.getIsAllDay());
            event.setReminderMinutesBefore(request.getReminderMinutesBefore());
            event.setUser(owner);

            if (event.getEndTime() == null || event.getStartTime() == null || !event.getEndTime().isAfter(event.getStartTime())) {
                throw new DateTimeException("Date is not correct");
            }

            eventService.save(event);
            response.put("message", "Event " + event.getTitle() + " created successfully!");

            return new ResponseEntity<>(response, HttpStatus.CREATED);

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

        if (actor == null || !canAccessUser(actor, existingEvent.get().getUser())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para actualizar este evento.");
        }

        Optional<Event> updatedEvent = eventService.updateEventById(id, eventDetails);
        return updatedEvent.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id,
                                         @RequestHeader("Authorization") String token) {
        User actor = getActor(token);
        Optional<Event> existingEvent = eventService.getEventById(id);

        if (existingEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (actor == null || !canAccessUser(actor, existingEvent.get().getUser())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para eliminar este evento.");
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

    private User getActor(String token) {
        String tokenF = token.replace("Bearer ", "").trim();
        String username = jwtUtil.extractUsername(tokenF);
        return userService.getUserByUsername(username);
    }

    private User resolveTargetUser(User actor, Long targetUserId) {
        if (actor.getRole() != UserRole.ADMIN) {
            return actor;
        }

        if (targetUserId == null) {
            throw new SecurityException("Debes seleccionar un usuario subordinado.");
        }

        User managedUser = userService.getManagedUser(actor.getId(), targetUserId);
        if (managedUser == null) {
            throw new SecurityException("No tienes permiso para operar sobre ese usuario.");
        }

        return managedUser;
    }

    private boolean canAccessUser(User actor, User owner) {
        if (owner == null) {
            return false;
        }

        if (owner.getId().equals(actor.getId())) {
            return true;
        }

        return actor.getRole() == UserRole.ADMIN
                && userService.getManagedUser(actor.getId(), owner.getId()) != null;
    }
}
