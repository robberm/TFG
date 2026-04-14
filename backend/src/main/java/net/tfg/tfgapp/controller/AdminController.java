package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateOrganizationRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateUserRequest;
import net.tfg.tfgapp.DTOs.users.UserSummaryResponse;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.Organization;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.security.TokenService;
import net.tfg.tfgapp.service.interfaces.IAdminService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestMapping("/admin")
@RestController
public class AdminController {

    private final IAdminService organizationAdminService;
    private final IUserService userService;
    private final TokenService tokenService;

    public AdminController(IAdminService organizationAdminService,
                           IUserService userService,
                           TokenService tokenService) {
        this.organizationAdminService = organizationAdminService;
        this.userService = userService;
        this.tokenService = tokenService;
    }

    @GetMapping("/users")
    public ResponseEntity<?> getManagedUsers(@RequestHeader("Authorization") String authHeader) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            List<UserSummaryResponse> users = organizationAdminService.getManagedUsers(adminUsername);
            return ResponseEntity.ok(users);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al recuperar los usuarios subordinados.");
        }
    }

    @PostMapping("/users")
    public ResponseEntity<?> createManagedUser(@RequestHeader("Authorization") String authHeader,
                                               @RequestBody AdminCreateUserRequest request) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            UserSummaryResponse createdUser = organizationAdminService.createManagedUser(adminUsername, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al crear el usuario subordinado.");
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteManagedUser(@RequestHeader("Authorization") String authHeader,
                                               @PathVariable Long userId) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            organizationAdminService.deleteManagedUser(adminUsername, userId);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al eliminar el usuario subordinado.");
        }
    }

    @PostMapping("/organization")
    public ResponseEntity<?> createOrganization(@RequestHeader("Authorization") String authHeader,
                                                @RequestBody AdminCreateOrganizationRequest request) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            Organization organization = organizationAdminService.createOrganizationForAdmin(adminUsername, request);

            Map<String, Object> response = new HashMap<>();
            response.put("organizationId", organization.getId());
            response.put("organizationName", organization.getName());
            response.put("message", "Organización creada correctamente.");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al crear la organización.");
        }
    }

    @GetMapping("/users/{userId}/goals")
    public ResponseEntity<?> getManagedUserGoals(@RequestHeader("Authorization") String authHeader,
                                                 @PathVariable Long userId) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            List<Goal> goals = organizationAdminService.getManagedUserGoals(adminUsername, userId);
            return ResponseEntity.ok(goals);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/users/{userId}/goals")
    public ResponseEntity<?> createManagedUserGoal(@RequestHeader("Authorization") String authHeader,
                                                   @PathVariable Long userId,
                                                   @RequestBody GoalRequest request) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            Goal goal = organizationAdminService.createManagedUserGoal(adminUsername, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(goal);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/users/{userId}/goals/{goalId}")
    public ResponseEntity<?> updateManagedUserGoal(@RequestHeader("Authorization") String authHeader,
                                                   @PathVariable Long userId,
                                                   @PathVariable Integer goalId,
                                                   @RequestBody GoalRequest request) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            Goal goal = organizationAdminService.updateManagedUserGoal(adminUsername, userId, goalId, request);
            return ResponseEntity.ok(goal);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}/goals/{goalId}")
    public ResponseEntity<?> deleteManagedUserGoal(@RequestHeader("Authorization") String authHeader,
                                                   @PathVariable Long userId,
                                                   @PathVariable Integer goalId) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            organizationAdminService.deleteManagedUserGoal(adminUsername, userId, goalId);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/users/{userId}/events")
    public ResponseEntity<?> getManagedUserEvents(@RequestHeader("Authorization") String authHeader,
                                                  @PathVariable Long userId,
                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            List<Event> events = organizationAdminService.getManagedUserEvents(adminUsername, userId, start, end);
            return ResponseEntity.ok(events);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/users/{userId}/events")
    public ResponseEntity<?> createManagedUserEvent(@RequestHeader("Authorization") String authHeader,
                                                    @PathVariable Long userId,
                                                    @RequestBody Event event) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            Event savedEvent = organizationAdminService.createManagedUserEvent(adminUsername, userId, event);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedEvent);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/users/{userId}/events/{eventId}")
    public ResponseEntity<?> updateManagedUserEvent(@RequestHeader("Authorization") String authHeader,
                                                    @PathVariable Long userId,
                                                    @PathVariable Long eventId,
                                                    @RequestBody Event eventDetails) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            Event updatedEvent = organizationAdminService.updateManagedUserEvent(adminUsername, userId, eventId, eventDetails);
            return ResponseEntity.ok(updatedEvent);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}/events/{eventId}")
    public ResponseEntity<?> deleteManagedUserEvent(@RequestHeader("Authorization") String authHeader,
                                                    @PathVariable Long userId,
                                                    @PathVariable Long eventId) {
        try {
            String adminUsername = getAdminUsernameFromHeader(authHeader);
            organizationAdminService.deleteManagedUserEvent(adminUsername, userId, eventId);
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    private String getAdminUsernameFromHeader(String authHeader) {
        String token = extractAndVerifyToken(authHeader);
        return tokenService.extractUsername(token);
    }

    private String extractAndVerifyToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Token de autenticación no proporcionado o formato incorrecto.");
        }

        String token = authHeader.replace("Bearer ", "").trim();

        if (!tokenService.validateToken(token)) {
            throw new IllegalArgumentException("Token de autenticación inválido o expirado.");
        }

        String username = tokenService.extractUsername(token);
        User user = userService.getUserByUsername(username);

        if (user == null) {
            throw new IllegalArgumentException("Usuario asociado al token no encontrado.");
        }

        if (!tokenService.validateToken(token, user.getUsername(), user.getTokenVersion())) {
            throw new IllegalArgumentException("Token revocado o no válido.");
        }

        return token;
    }
}
