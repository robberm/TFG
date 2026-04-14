package net.tfg.tfgapp.controller.objectives;

import net.tfg.tfgapp.DTOs.objectives.GoalProgressRequest;
import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.enumerates.UserRole;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.interfaces.IGoalService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

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
    public ResponseEntity<?> getMyGoals(@RequestHeader("Authorization") String token,
                                        @RequestParam(required = false) Long targetUserId) {
        User actor = getActor(token);

        if (actor == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
        }

        if (actor.getRole() == UserRole.ADMIN && targetUserId != null) {
            User managedUser = userService.getManagedUser(actor.getId(), targetUserId);
            if (managedUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso sobre ese usuario.");
            }
            return ResponseEntity.ok(goalService.getByUsername(managedUser.getUsername()));
        }

        return ResponseEntity.ok(goalService.getByUsername(actor.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGoalById(@RequestHeader("Authorization") String token, @PathVariable Integer id) {
        User actor = getActor(token);
        Goal goal = goalService.findById(id);

        if (goal == null) {
            return ResponseEntity.notFound().build();
        }

        if (actor == null || !canAccessUser(actor, goal.getUser())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para acceder a este objetivo.");
        }

        return ResponseEntity.ok(goal);
    }

    @PostMapping
    public ResponseEntity<?> createGoal(@RequestHeader("Authorization") String token, @RequestBody GoalRequest request) {
        try {
            User actor = getActor(token);

            if (actor == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
            }

            if (actor.getRole() != UserRole.ADMIN) {
                Goal createdGoal = goalService.createGoal(request, actor);
                return ResponseEntity.status(HttpStatus.CREATED).body(createdGoal);
            }

            List<User> targetUsers = resolveTargetUsers(actor, request);
            List<Goal> createdGoals = targetUsers.stream()
                    .map(targetUser -> goalService.createGoal(request, targetUser))
                    .toList();
            return ResponseEntity.status(HttpStatus.CREATED).body(createdGoals);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Hubo un fallo al crear el objetivo: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGoal(@RequestHeader("Authorization") String token,
                                        @PathVariable Integer id,
                                        @RequestBody GoalRequest request) {
        User actor = getActor(token);
        Goal existingGoal = goalService.findById(id);

        if (existingGoal == null) {
            return ResponseEntity.notFound().build();
        }

        if (actor == null || !canAccessUser(actor, existingGoal.getUser())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(goalService.updateGoal(existingGoal, request));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<?> updateGoalProgress(@RequestHeader("Authorization") String token,
                                                @PathVariable Integer id,
                                                @RequestBody GoalProgressRequest request) {
        User actor = getActor(token);
        Goal goal = goalService.findById(id);

        if (goal == null) {
            return ResponseEntity.notFound().build();
        }

        if (actor == null || !canAccessUser(actor, goal.getUser())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(goalService.updateGoalProgress(goal, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGoal(@RequestHeader("Authorization") String token, @PathVariable Integer id) {
        User actor = getActor(token);
        Goal goal = goalService.findById(id);

        if (goal == null) {
            return ResponseEntity.notFound().build();
        }

        if (actor == null || !canAccessUser(actor, goal.getUser())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        goalService.deleteById(id);
        return ResponseEntity.ok("Objetivo eliminado correctamente.");
    }

    private User getActor(String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
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

    private List<User> resolveTargetUsers(User actor, GoalRequest request) {
        List<User> targets = new ArrayList<>();
        List<Long> requestedIds = request.getTargetUserIds();
        boolean targetAllManaged = Boolean.TRUE.equals(request.getTargetAllManaged());

        if (targetAllManaged) {
            targets.addAll(userService.getManagedUsers(actor.getId()));
        } else if (requestedIds != null && !requestedIds.isEmpty()) {
            for (Long userId : new LinkedHashSet<>(requestedIds)) {
                User managedUser = userService.getManagedUser(actor.getId(), userId);
                if (managedUser == null) {
                    throw new SecurityException("No tienes permiso para operar sobre uno de los usuarios seleccionados.");
                }
                targets.add(managedUser);
            }
        } else if (request.getTargetUserId() != null) {
            targets.add(resolveTargetUser(actor, request.getTargetUserId()));
        } else {
            throw new SecurityException("Debes seleccionar al menos un usuario subordinado.");
        }

        if (targets.isEmpty()) {
            throw new SecurityException("No hay usuarios subordinados disponibles para asignar.");
        }

        return targets;
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
