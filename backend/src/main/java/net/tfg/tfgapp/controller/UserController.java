package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.users.ChangePasswordRequest;
import net.tfg.tfgapp.DTOs.users.ChangeUsernameRequest;
import net.tfg.tfgapp.DTOs.users.LoginRequest;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.security.TokenService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import net.tfg.tfgapp.service.interfaces.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
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

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request) {
        boolean authenticated = accountService.authenticate(request);

        if (!authenticated) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Usuario o contraseña invalida. Repita de nuevo.");
        }

        User user = userService.getUserByUsername(request.getUsername());
        String token = tokenService.generateToken(user.getUsername(), user.getTokenVersion());

        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("message", "Log-in correcto!");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User newUser) {
        try {
            User user = accountService.register(newUser);

            String token = tokenService.generateToken(user.getUsername(), user.getTokenVersion());

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("username", user.getUsername());
            response.put("message", "Usuario registrado correctamente.");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al registrar usuario");
        }
    }

    @PostMapping("change/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String usernameFromToken = tokenService.extractUsername(token);

            User updatedUser = accountService.changePassword(usernameFromToken, request);
            String newToken = tokenService.generateToken(updatedUser.getUsername(), updatedUser.getTokenVersion());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Contraseña actualizada correctamente.");
            response.put("token", newToken);
            response.put("username", updatedUser.getUsername());

            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al actualizar contraseña");
        }
    }

    @PostMapping("change/username")
    public ResponseEntity<?> changeUsername(@RequestBody ChangeUsernameRequest request,
                                            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String usernameFromToken = tokenService.extractUsername(token);

            User updatedUser = accountService.changeUsername(usernameFromToken, request);
            String newToken = tokenService.generateToken(updatedUser.getUsername(), updatedUser.getTokenVersion());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Username actualizado correctamente.");
            response.put("token", newToken);
            response.put("username", updatedUser.getUsername());

            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al actualizar usuario");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String usernameFromToken = tokenService.extractUsername(token);

            return ResponseEntity.ok(accountService.getProfileData(usernameFromToken));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al recuperar el perfil");
        }
    }

    @PutMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProfileImage(@RequestParam("file") MultipartFile file,
                                                @RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String usernameFromToken = tokenService.extractUsername(token);

            User updatedUser = accountService.updateProfileImage(usernameFromToken, file);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Imagen de perfil actualizada correctamente.");
            response.put("profileImagePath", updatedUser.getProfileImagePath());

            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al actualizar la imagen de perfil");
        }
    }

    @DeleteMapping("/profile-image")
    public ResponseEntity<?> deleteProfileImage(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = extractAndVerifyToken(authHeader);
            String usernameFromToken = tokenService.extractUsername(token);

            accountService.removeProfileImage(usernameFromToken);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Imagen de perfil eliminada correctamente.");
            response.put("profileImagePath", null);

            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al eliminar la imagen de perfil");
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