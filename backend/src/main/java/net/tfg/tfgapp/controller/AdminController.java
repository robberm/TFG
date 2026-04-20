package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.users.AdminCreateOrganizationRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateUserRequest;
import net.tfg.tfgapp.DTOs.users.UserSummaryResponse;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.Organization;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.exception.ApiException;
import net.tfg.tfgapp.security.TokenService;
import net.tfg.tfgapp.service.interfaces.IAdminService;
import net.tfg.tfgapp.service.interfaces.IUserService;
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

    @GetMapping("/users")
    public ResponseEntity<?> getManagedUsers(@RequestHeader("Authorization") String authHeader) {
        String token = extractAndVerifyToken(authHeader);
        String adminUsername = tokenService.extractUsername(token);

        List<UserSummaryResponse> users = organizationAdminService.getManagedUsers(adminUsername);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    public ResponseEntity<?> createManagedUser(@RequestHeader("Authorization") String authHeader,
                                               @RequestBody AdminCreateUserRequest request) {
        String token = extractAndVerifyToken(authHeader);
        String adminUsername = tokenService.extractUsername(token);

        UserSummaryResponse createdUser = organizationAdminService.createManagedUser(adminUsername, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteManagedUser(@RequestHeader("Authorization") String authHeader,
                                               @PathVariable Long userId) {
        String token = extractAndVerifyToken(authHeader);
        String adminUsername = tokenService.extractUsername(token);

        organizationAdminService.deleteManagedUser(adminUsername, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/organization")
    public ResponseEntity<?> createOrganization(@RequestHeader("Authorization") String authHeader,
                                                @RequestBody AdminCreateOrganizationRequest request) {
        String token = extractAndVerifyToken(authHeader);
        String adminUsername = tokenService.extractUsername(token);

        Organization organization = organizationAdminService.createOrganizationForAdmin(adminUsername, request);

        Map<String, Object> response = new HashMap<>();
        response.put("organizationId", organization.getId());
        response.put("organizationName", organization.getName());
        response.put("message", "Organización creada correctamente.");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/users/{userId}/goals")
    public ResponseEntity<?> getManagedUserGoals(@RequestHeader("Authorization") String authHeader,
                                                 @PathVariable Long userId) {
        String token = extractAndVerifyToken(authHeader);
        String adminUsername = tokenService.extractUsername(token);

        List<Goal> goals = organizationAdminService.getManagedUserGoals(adminUsername, userId);
        return ResponseEntity.ok(goals);
    }

    private String extractAndVerifyToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token de autenticación no proporcionado o formato incorrecto.");
        }

        String token = authHeader.replace("Bearer ", "").trim();

        if (!tokenService.validateToken(token)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token de autenticación inválido o expirado.");
        }

        String username = tokenService.extractUsername(token);
        User user = userService.getUserByUsername(username);

        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Usuario asociado al token no encontrado.");
        }

        if (!tokenService.validateToken(token, user.getUsername(), user.getTokenVersion())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Token revocado o no válido.");
        }

        return token;
    }
}
