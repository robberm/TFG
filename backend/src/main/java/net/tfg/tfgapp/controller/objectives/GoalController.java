package net.tfg.tfgapp.controller.objectives;

import net.tfg.tfgapp.DTOs.objectives.GoalProgressRequest;
import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.enumerates.UserRole;
import net.tfg.tfgapp.exception.ApiException;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.interfaces.IGoalService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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

        if (actor.getRole() == UserRole.ADMIN) {
            if (targetUserId != null) {
                User managedUser = userService.getUserById(targetUserId);
                if (!canAccessManagedUser(actor, managedUser)) {
                    throw new SecurityException("No tienes permiso sobre ese usuario.");
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
            throw new ApiException(HttpStatus.NOT_FOUND, "Objetivo no encontrado.");
        }

        if (!canAccessGoal(actor, goal)) {
            throw new SecurityException("No tienes permiso para acceder a este objetivo.");
        }

        return ResponseEntity.ok(goal);
    }

    @PostMapping
    public ResponseEntity<?> createGoal(@RequestHeader("Authorization") String token, @RequestBody GoalRequest request) {
        User actor = getActor(token);

        List<User> targets = resolveTargetUsers(actor, request);
        List<Goal> createdGoals = new ArrayList<>();

        for (User target : targets) {
            Goal createdGoal = goalService.createGoal(request, target);
            if (actor.getRole() == UserRole.ADMIN) {
                createdGoal.setAssignedByAdmin(actor);
                createdGoal = goalService.updateGoal(createdGoal, request);
            }
            createdGoals.add(createdGoal);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(createdGoals);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGoal(@RequestHeader("Authorization") String token,
                                        @PathVariable Integer id,
                                        @RequestBody GoalRequest request) {
        User actor = getActor(token);
        Goal existingGoal = goalService.findById(id);

        if (existingGoal == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Objetivo no encontrado.");
        }

        if (!canAccessGoal(actor, existingGoal)) {
            throw new SecurityException("No tienes permiso para actualizar este objetivo.");
        }

        if (actor.getRole() != UserRole.ADMIN && existingGoal.isAssignedByAdmin()) {
            GoalRequest restrictedRequest = new GoalRequest();
            restrictedRequest.setTitulo(existingGoal.getTitulo());
            restrictedRequest.setDescription(existingGoal.getDescription());
            restrictedRequest.setPriority(existingGoal.getPriority());
            restrictedRequest.setActive(existingGoal.getActive());
            restrictedRequest.setNumeric(existingGoal.isNumeric());
            restrictedRequest.setValorObjetivo(existingGoal.getValorObjetivo());
            restrictedRequest.setStatus(request.getStatus() != null ? request.getStatus() : existingGoal.getStatus());
            restrictedRequest.setValorProgreso(
                    existingGoal.isNumeric()
                            ? (request.getValorProgreso() != null ? request.getValorProgreso() : existingGoal.getValorProgreso())
                            : null
            );

            return ResponseEntity.ok(goalService.updateGoal(existingGoal, restrictedRequest));
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
            throw new ApiException(HttpStatus.NOT_FOUND, "Objetivo no encontrado.");
        }

        if (!canAccessGoal(actor, goal)) {
            throw new SecurityException("No tienes permiso para actualizar este objetivo.");
        }

        return ResponseEntity.ok(goalService.updateGoalProgress(goal, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGoal(@RequestHeader("Authorization") String token, @PathVariable Integer id) {
        User actor = getActor(token);
        Goal goal = goalService.findById(id);

        if (goal == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Objetivo no encontrado.");
        }

        if (!canAccessGoal(actor, goal)) {
            throw new SecurityException("No tienes permiso para eliminar este objetivo.");
        }

        if (actor.getRole() != UserRole.ADMIN && goal.isAssignedByAdmin()) {
            throw new SecurityException("No puedes eliminar objetivos asignados por administrador.");
        }

        goalService.deleteById(id);
        return ResponseEntity.ok("Objetivo eliminado correctamente.");
    }

    private User getActor(String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        User actor = userService.getUserByUsername(username);
        if (actor == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Usuario no encontrado.");
        }
        return actor;
    }

    private List<User> resolveTargetUsers(User actor, GoalRequest request) {
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

        throw new SecurityException("Debes seleccionar al menos un usuario.");
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
                && goal.getAssignedByAdmin().getId().equals(actor.getId())
                && canAccessManagedUser(actor, goal.getUser());
    }
}
