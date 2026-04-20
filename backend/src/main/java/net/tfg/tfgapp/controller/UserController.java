package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.users.ChangePasswordRequest;
import net.tfg.tfgapp.DTOs.users.ChangeUsernameRequest;
import net.tfg.tfgapp.DTOs.users.LoginRequest;
import net.tfg.tfgapp.DTOs.users.UserProfileResponse;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.exception.ApiException;
import net.tfg.tfgapp.security.TokenService;
import net.tfg.tfgapp.service.interfaces.AccountService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RequestMapping("/users")
@RestController
public class UserController {

    private final IUserService userService;
    private final TokenService tokenService;
    private final AccountService accountService;

    public UserController(IUserService userService,
                          TokenService tokenService,
                          AccountService accountService) {
        this.userService = userService;
        this.tokenService = tokenService;
        this.accountService = accountService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        boolean authenticated = accountService.authenticate(request);

        if (!authenticated) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuario o contraseña inválida."
            );
        }

        User user = userService.getUserByUsername(request.getUsername());
        String token = tokenService.generateToken(user.getUsername(), user.getTokenVersion());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole().name());
        response.put("organizationId", user.getOrganization() != null ? user.getOrganization().getId() : null);
        response.put("organizationName", user.getOrganization() != null ? user.getOrganization().getName() : null);
        response.put("message", "Log-in correcto!");

        return ResponseEntity.ok(response);
    }

    /**
     * Registro público para usuarios personales.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User newUser) {
        User user = accountService.register(newUser);

        String token = tokenService.generateToken(user.getUsername(), user.getTokenVersion());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole().name());
        response.put("organizationId", null);
        response.put("organizationName", null);
        response.put("message", "Usuario registrado correctamente.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("change/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                            @RequestHeader("Authorization") String authHeader) {
        String token = extractAndVerifyToken(authHeader);
        String usernameFromToken = tokenService.extractUsername(token);

        User updatedUser = accountService.changePassword(usernameFromToken, request);
        String newToken = tokenService.generateToken(updatedUser.getUsername(), updatedUser.getTokenVersion());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Contraseña actualizada correctamente.");
        response.put("token", newToken);
        response.put("username", updatedUser.getUsername());
        response.put("role", updatedUser.getRole().name());
        response.put("organizationId", updatedUser.getOrganization() != null ? updatedUser.getOrganization().getId() : null);
        response.put("organizationName", updatedUser.getOrganization() != null ? updatedUser.getOrganization().getName() : null);

        return ResponseEntity.ok(response);
    }

    @PostMapping("change/username")
    public ResponseEntity<?> changeUsername(@RequestBody ChangeUsernameRequest request,
                                            @RequestHeader("Authorization") String authHeader) {
        String token = extractAndVerifyToken(authHeader);
        String usernameFromToken = tokenService.extractUsername(token);

        User updatedUser = accountService.changeUsername(usernameFromToken, request);
        String newToken = tokenService.generateToken(updatedUser.getUsername(), updatedUser.getTokenVersion());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Username actualizado correctamente.");
        response.put("token", newToken);
        response.put("username", updatedUser.getUsername());
        response.put("role", updatedUser.getRole().name());
        response.put("organizationId", updatedUser.getOrganization() != null ? updatedUser.getOrganization().getId() : null);
        response.put("organizationName", updatedUser.getOrganization() != null ? updatedUser.getOrganization().getName() : null);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile(@RequestHeader("Authorization") String authHeader) {
        String token = extractAndVerifyToken(authHeader);
        String usernameFromToken = tokenService.extractUsername(token);

        UserProfileResponse response = accountService.getProfileData(usernameFromToken);
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProfileImage(@RequestParam("file") MultipartFile file,
                                                @RequestHeader("Authorization") String authHeader) {
        String token = extractAndVerifyToken(authHeader);
        String usernameFromToken = tokenService.extractUsername(token);

        User updatedUser = accountService.updateProfileImage(usernameFromToken, file);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Imagen de perfil actualizada correctamente.");
        response.put("profileImagePath", updatedUser.getProfileImagePath());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/profile-image")
    public ResponseEntity<?> deleteProfileImage(@RequestHeader("Authorization") String authHeader) {
        String token = extractAndVerifyToken(authHeader);
        String usernameFromToken = tokenService.extractUsername(token);

        accountService.removeProfileImage(usernameFromToken);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Imagen de perfil eliminada correctamente.");
        response.put("profileImagePath", null);

        return ResponseEntity.ok(response);
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
