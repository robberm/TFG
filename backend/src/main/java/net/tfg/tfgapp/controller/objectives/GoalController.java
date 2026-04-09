package net.tfg.tfgapp.controller.objectives;

import net.tfg.tfgapp.DTOs.objectives.GoalProgressRequest;
import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.interfaces.IGoalService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final IGoalService goalService;
    private final JwtUtil jwtUtil;
    private final IUserService userService;

    public GoalController(IGoalService goalService, JwtUtil jwtUtil, IUserService userService) {
        this.goalService = goalService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<?> getMyGoals(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        return ResponseEntity.ok(goalService.getByUsername(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGoalById(@RequestHeader("Authorization") String token, @PathVariable Integer id) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Goal goal = goalService.findById(id);

        if (goal == null) {
            return ResponseEntity.notFound().build();
        }

        if (!goal.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para acceder a este objetivo.");
        }

        return ResponseEntity.ok(goal);
    }

    @PostMapping
    public ResponseEntity<?> createGoal(@RequestHeader("Authorization") String token, @RequestBody GoalRequest request) {
        try {
            String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
            User user = userService.getUserByUsername(username);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
            }

            Goal createdGoal = goalService.createGoal(request, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdGoal);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Hubo un fallo al crear el objetivo: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGoal(@RequestHeader("Authorization") String token,
                                        @PathVariable Integer id,
                                        @RequestBody GoalRequest request) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Goal existingGoal = goalService.findById(id);

        if (existingGoal == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existingGoal.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(goalService.updateGoal(existingGoal, request));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<?> updateGoalProgress(@RequestHeader("Authorization") String token,
                                                @PathVariable Integer id,
                                                @RequestBody GoalProgressRequest request) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Goal goal = goalService.findById(id);

        if (goal == null) {
            return ResponseEntity.notFound().build();
        }

        if (!goal.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(goalService.updateGoalProgress(goal, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGoal(@RequestHeader("Authorization") String token, @PathVariable Integer id) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Goal goal = goalService.findById(id);

        if (goal == null) {
            return ResponseEntity.notFound().build();
        }

        if (!goal.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        goalService.deleteById(id);
        return ResponseEntity.ok("Objetivo eliminado correctamente.");
    }
}