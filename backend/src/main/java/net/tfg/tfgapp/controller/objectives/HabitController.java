package net.tfg.tfgapp.controller.objectives;

import net.tfg.tfgapp.DTOs.objectives.HabitCompletionRequest;
import net.tfg.tfgapp.DTOs.objectives.HabitRequest;
import net.tfg.tfgapp.domains.Habit;
import net.tfg.tfgapp.domains.ObjectiveLog;
import net.tfg.tfgapp.domains.User;


import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.interfaces.IHabitService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/habits")
public class HabitController {

    private final IHabitService habitService;
    private final JwtUtil jwtUtil;
    private final IUserService userService;

    public HabitController(IHabitService habitService, JwtUtil jwtUtil, IUserService userService) {
        this.habitService = habitService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<?> getMyHabits(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        return ResponseEntity.ok(habitService.getByUsername(username));
    }

    @GetMapping("/active")
    public ResponseEntity<?> getMyActiveHabits(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        return ResponseEntity.ok(habitService.getActiveHabitsByUsername(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHabitById(@RequestHeader("Authorization") String token, @PathVariable Integer id) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Habit habit = habitService.findById(id);

        if (habit == null) {
            return ResponseEntity.notFound().build();
        }

        if (!habit.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para acceder a este hábito.");
        }

        return ResponseEntity.ok(habit);
    }

    @PostMapping
    public ResponseEntity<?> createHabit(@RequestHeader("Authorization") String token,
                                         @RequestBody HabitRequest request) {
        try {
            String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
            User user = userService.getUserByUsername(username);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
            }

            Habit createdHabit = habitService.createHabit(request, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdHabit);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Hubo un fallo al crear el hábito: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHabit(@RequestHeader("Authorization") String token,
                                         @PathVariable Integer id,
                                         @RequestBody HabitRequest request) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Habit existingHabit = habitService.findById(id);

        if (existingHabit == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existingHabit.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(habitService.updateHabit(existingHabit, request));
    }

    @PatchMapping("/{id}/completion")
    public ResponseEntity<?> markHabitCompletion(@RequestHeader("Authorization") String token,
                                                 @PathVariable Integer id,
                                                 @RequestBody HabitCompletionRequest request) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Habit habit = habitService.findById(id);

        if (habit == null) {
            return ResponseEntity.notFound().build();
        }

        if (!habit.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        ObjectiveLog log = habitService.markHabitCompletion(habit, request);
        return ResponseEntity.ok(log);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHabit(@RequestHeader("Authorization") String token, @PathVariable Integer id) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Habit habit = habitService.findById(id);

        if (habit == null) {
            return ResponseEntity.notFound().build();
        }

        if (!habit.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        habitService.deleteById(id);
        return ResponseEntity.ok("Hábito eliminado correctamente.");
    }
}