package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.users.AdminCreateOrganizationRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateUserRequest;
import net.tfg.tfgapp.DTOs.users.UserSummaryResponse;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.Organization;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.security.TokenService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import net.tfg.tfgapp.service.interfaces.IAdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    /**
     * Recupera los usuarios subordinados al admin autenticado.
     */
    @GetMapping("/users")
    public ResponseEntity<?> getManagedUsers(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String adminUsername = tokenService.extractUsername(token);

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

    /**
     * Alta de usuario personal subordinado.
     */
    @PostMapping("/users")
    public ResponseEntity<?> createManagedUser(@RequestHeader("Authorization") String authHeader,
                                               @RequestBody AdminCreateUserRequest request) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String adminUsername = tokenService.extractUsername(token);

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

    /**
     * Baja de usuario subordinado.
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteManagedUser(@RequestHeader("Authorization") String authHeader,
                                               @PathVariable Long userId) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String adminUsername = tokenService.extractUsername(token);

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

    /**
     * Alta inicial de organización para administradores sin organización asociada.
     */
    @PostMapping("/organization")
    public ResponseEntity<?> createOrganization(@RequestHeader("Authorization") String authHeader,
                                                @RequestBody AdminCreateOrganizationRequest request) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String adminUsername = tokenService.extractUsername(token);

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
            String token = extractAndVerifyToken(authHeader);
            String adminUsername = tokenService.extractUsername(token);

            List<Goal> goals = organizationAdminService.getManagedUserGoals(adminUsername, userId);
            return ResponseEntity.ok(goals);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al recuperar los goals del usuario subordinado.");
        }
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
