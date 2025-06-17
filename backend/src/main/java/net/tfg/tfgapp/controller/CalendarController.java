package net.tfg.tfgapp.controller;


import jakarta.persistence.EntityNotFoundException;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.repos.EventRepo;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.EventService;
import net.tfg.tfgapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("events")
public class CalendarController {

    @Autowired
    private EventService eventService;

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserService userService;

//    @Autowired
//    private SimpMessagingTemplate messagingTemplate;

    // Get all events
    @GetMapping("/{username}")
    public ResponseEntity<?> getAllEvents(@PathVariable String username) {
        try {
            // Obtienes los eventos del usuario con el servicio
            List<Event> eventsList = eventService.getEventsByUsername(username);

            // Si no se encuentran eventos, se retorna un mensaje apropiado
            if (eventsList.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No events found for user: " + username);
            }

            // Si hay eventos, se retornan con un código 200
            return ResponseEntity.ok(eventsList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error fetching events: " + e.getMessage());
        }
    }


    // Get a specific event by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable Long id) {
        Optional<Event> event = eventService.getEventById(id);
        return event.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Get events between specific dates
    @GetMapping("/range")
    public List<?> getEventsBetween(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestHeader("Authorization") String token) { // Para pasar el token y extraer el usuario

        String tokenF = token.replace("Bearer ", "").trim();
        String username = jwtUtil.extractUsername(tokenF);  // Extraemos el nombre de usuario del token

        return eventService.findEventsByUserAndDateRange(username, start, end);  // Pasamos username y fechas al servicio
    }


    // Create a new event
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Event event, @RequestHeader("Authorization") String token) {

        try{
            Map<String, String> response = new HashMap<>();
            String tokenF = token.replace("Bearer ", "").trim();
            String username = jwtUtil.extractUsername(tokenF);

            if (userService.getUserByUsername(username) == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
            }
            event.setUser(userService.getUserByUsername(username));

            if(event.getEndTime().isAfter(event.getStartTime())) {
                eventService.save(event);
                response.put("message", "Event "+event.getTitle()+" created successfully!");

                return new ResponseEntity<>(response, HttpStatus.CREATED);

            }else{
             throw new DateTimeException("Date is not correct");
            }

        } catch (DateTimeException e) {
            // Capturamos la excepción y devolvemos el error
            return ResponseEntity.badRequest().body("Hubo un fallo al crear el evento: "+e.getMessage());
        }
    }

    // Update an existing event
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Event eventDetails) {
        Optional<Event> updatedEvent = eventService.updateEventById(id, eventDetails);

        if (updatedEvent.isPresent()) {
            //messagingTemplate.convertAndSend("/topic/calendar", "EVENT_UPDATED");
            return ResponseEntity.ok(updatedEvent.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }


    // Delete an event
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        try {
            eventService.deleteEventById(id);
            //messagingTemplate.convertAndSend("/topic/calendar", "EVENT_DELETED");
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

}

