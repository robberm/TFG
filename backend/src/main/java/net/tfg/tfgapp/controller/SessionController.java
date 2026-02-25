package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.components.SessionStore;
import net.tfg.tfgapp.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/session")
public class SessionController {

    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final SessionStore sessionStore;

    public SessionController(JwtUtil jwtUtil,
                             UserService userService,
                             SessionStore sessionStore) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.sessionStore = sessionStore;
    }

    /**
     * Actualiza cuál es el usuario activo en un dispositivo.
     */
    @PostMapping("/active-user")
    public ResponseEntity<?> registerActiveUser(@RequestHeader("Authorization") String token) {
        String tokenF = token.replace("Bearer ", "").trim();
        String username = jwtUtil.extractUsername(tokenF);

        User user = userService.getUserByUsername(username);
        if (user == null) return ResponseEntity.badRequest().build();

        sessionStore.setLoggedUser(user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/clear")
    public ResponseEntity<?> clearActiveUser() {
        sessionStore.clearLoggedUser();
        return ResponseEntity.noContent().build();
    }
}
