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

import java.util.*;
import java.util.stream.Collectors;

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

        if (actor.getRole() == UserRole.ADMIN) {
            if (targetUserId != null) {
                User managedUser = userService.getUserById(targetUserId);
                if (!canAccessManagedUser(actor, managedUser)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso sobre ese usuario.");
                }
                return ResponseEntity.ok(goalService.getAssignedGoalsForAdminAndUser(actor.getId(), managedUser.getId()));
            }
            return ResponseEntity.ok(goalService.getAssignedGoalsForAdmin(actor.getId()));
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

        if (actor == null || !canAccessGoal(actor, goal)) {
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

            List<User> targets = resolveTargetUsers(actor, request, actor);
            String assignmentGroupId = actor.getRole() == UserRole.ADMIN ? UUID.randomUUID().toString() : null;
            List<Goal> createdGoals = new ArrayList<>();

            for (User target : targets) {
                Goal createdGoal = goalService.createGoal(request, target);
                if (actor.getRole() == UserRole.ADMIN) {
                    createdGoal.setAssignedByAdmin(actor);
                    createdGoal.setAssignmentGroupId(assignmentGroupId);
                    createdGoal = goalService.updateGoal(createdGoal, request);
                }
                createdGoals.add(createdGoal);
            }

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

        if (actor == null || !canAccessGoal(actor, existingGoal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (actor.getRole() == UserRole.ADMIN && existingGoal.getAssignedByAdmin() != null) {
            List<User> targets = resolveTargetUsers(actor, request, existingGoal.getUser());
            Goal result = upsertAssignmentGroup(existingGoal, request, actor, targets);
            return ResponseEntity.ok(result);
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

        if (actor == null || !canAccessGoal(actor, goal)) {
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

        if (actor == null || !canAccessGoal(actor, goal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (actor.getRole() == UserRole.ADMIN && goal.getAssignedByAdmin() != null && goal.getAssignmentGroupId() != null) {
            goalService.deleteGoals(goalService.getGoalsByAssignmentGroup(goal.getAssignmentGroupId(), actor.getId()));
            return ResponseEntity.ok("Objetivo eliminado correctamente.");
        }

        goalService.deleteById(id);
        return ResponseEntity.ok("Objetivo eliminado correctamente.");
    }

    private Goal upsertAssignmentGroup(Goal existing,
                                       GoalRequest request,
                                       User admin,
                                       List<User> targets) {
        String groupId = existing.getAssignmentGroupId() != null ? existing.getAssignmentGroupId() : UUID.randomUUID().toString();
        List<Goal> grouped = goalService.getGoalsByAssignmentGroup(groupId, admin.getId());
        if (grouped.isEmpty()) {
            existing.setAssignmentGroupId(groupId);
            grouped = List.of(existing);
        }

        Map<Long, Goal> byUserId = grouped.stream().collect(Collectors.toMap(goal -> goal.getUser().getId(), goal -> goal, (a, b) -> a));
        Set<Long> targetIds = targets.stream().map(User::getId).collect(Collectors.toSet());

        List<Goal> toDelete = grouped.stream().filter(goal -> !targetIds.contains(goal.getUser().getId())).toList();
        if (!toDelete.isEmpty()) {
            goalService.deleteGoals(toDelete);
        }

        Goal reference = null;
        for (User target : targets) {
            Goal goal = byUserId.get(target.getId());
            if (goal == null) {
                goal = new Goal();
                goal.setUser(target);
                goal.setAssignedByAdmin(admin);
                goal.setAssignmentGroupId(groupId);
            }
            goalService.applyGoalDetails(goal, request);
            goal.setAssignedByAdmin(admin);
            goal.setAssignmentGroupId(groupId);
            Goal saved = goalService.updateGoal(goal, request);
            if (reference == null || saved.getId().equals(existing.getId())) {
                reference = saved;
            }
        }

        return reference;
    }

    private User getActor(String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        return userService.getUserByUsername(username);
    }

    private List<User> resolveTargetUsers(User actor, GoalRequest request, User fallbackDefault) {
        if (actor.getRole() != UserRole.ADMIN) {
            return List.of(actor);
        }

        if (Boolean.TRUE.equals(request.getAssignToAllUsers())) {
            List<User> users = userService.getUsersInAdminScope(actor);
            if (users.isEmpty()) {
                throw new SecurityException("No hay usuarios subordinados para asignar.");
            }
            return users;
        }

        if (request.getTargetUserIds() != null && !request.getTargetUserIds().isEmpty()) {
            return request.getTargetUserIds().stream()
                    .map(userService::getUserById)
                    .peek(user -> {
                        if (!canAccessManagedUser(actor, user)) {
                            throw new SecurityException("No tienes permiso para operar sobre uno de los usuarios seleccionados.");
                        }
                    })
                    .distinct()
                    .toList();
        }

        if (request.getTargetUserId() != null) {
            User managedUser = userService.getUserById(request.getTargetUserId());
            if (!canAccessManagedUser(actor, managedUser)) {
                throw new SecurityException("No tienes permiso para operar sobre ese usuario.");
            }
            return List.of(managedUser);
        }

        return List.of(fallbackDefault);
    }


    private boolean canAccessManagedUser(User actor, User target) {
        if (actor == null || actor.getRole() != UserRole.ADMIN || target == null) {
            return false;
        }

        return userService.getUsersInAdminScope(actor).stream()
                .anyMatch(user -> user.getId().equals(target.getId()));
    }

    private boolean canAccessGoal(User actor, Goal goal) {
        if (goal.getUser().getId().equals(actor.getId())) {
            return true;
        }

        return actor.getRole() == UserRole.ADMIN
                && goal.getAssignedByAdmin() != null
                && goal.getAssignedByAdmin().getId().equals(actor.getId());
    }
}
