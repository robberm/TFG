package net.tfg.tfgapp.controller.objectives;

import net.tfg.tfgapp.DTOs.objectives.GoalProgressRequest;
import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.AdminUser;
import net.tfg.tfgapp.domains.PersonalUser;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.exception.ApiException;
import net.tfg.tfgapp.i18n.LanguageResolver;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.interfaces.IGoalService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final IGoalService goalService;
    private final JwtUtil jwtUtil;
    private final IUserService userService;
    private final LanguageResolver languageResolver;

    public GoalController(IGoalService goalService, JwtUtil jwtUtil, IUserService userService, LanguageResolver languageResolver) {
        this.goalService = goalService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.languageResolver = languageResolver;
    }

    @GetMapping
    public ResponseEntity<?> getMyGoals(@RequestHeader("Authorization") String token,
                                        @RequestHeader(value = "Accept-Language", required = false) String language,
                                        @RequestParam(required = false) Long targetUserId) {
        User actor = getActor(token, language);

        if (actor.isAdmin()) {
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
    public ResponseEntity<?> getGoalById(@RequestHeader("Authorization") String token,
                                       @RequestHeader(value = "Accept-Language", required = false) String language,
                                       @PathVariable Integer id) {
        User actor = getActor(token, language);
        Goal goal = goalService.findById(id);

        if (goal == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, languageResolver.text(language, "goal.notFound"));
        }

        if (!canAccessGoal(actor, goal)) {
            throw new SecurityException(languageResolver.text(language, "goal.noAccess"));
        }

        return ResponseEntity.ok(goal);
    }

    @PostMapping
    public ResponseEntity<?> createGoal(@RequestHeader("Authorization") String token,
                                        @RequestHeader(value = "Accept-Language", required = false) String language,
                                        @RequestBody GoalRequest request) {
        User actor = getActor(token, language);

        List<PersonalUser> targets = resolveTargetUsers(actor, request);
        String assignmentBatchId = actor.isAdmin() && targets.size() > 1
                ? UUID.randomUUID().toString()
                : null;
        List<Goal> createdGoals = new ArrayList<>();

        for (PersonalUser target : targets) {
            Goal createdGoal = goalService.createGoal(request, target);
            if (actor.isAdmin()) {
                createdGoal.setAssignedByAdmin((AdminUser) actor);
                createdGoal.setAssignmentBatchId(assignmentBatchId);
                createdGoal = goalService.updateGoal(createdGoal, request);
            }
            createdGoals.add(createdGoal);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(createdGoals);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGoal(@RequestHeader("Authorization") String token,
                                        @RequestHeader(value = "Accept-Language", required = false) String language,
                                        @PathVariable Integer id,
                                        @RequestBody GoalRequest request) {
        User actor = getActor(token, language);
        Goal existingGoal = goalService.findById(id);

        if (existingGoal == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, languageResolver.text(language, "goal.notFound"));
        }

        if (!canAccessGoal(actor, existingGoal)) {
            throw new SecurityException(languageResolver.text(language, "goal.noAccess"));
        }

        if (!actor.isAdmin() && existingGoal.isAssignedByAdmin()) {
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

        if (actor.isAdmin() && existingGoal.getAssignedByAdmin() != null) {
            List<PersonalUser> targets = resolveTargetUsers(actor, request);
            if (targets.isEmpty()) {
                throw new IllegalArgumentException("Debes seleccionar al menos un usuario.");
            }

            String existingBatchId = existingGoal.getAssignmentBatchId();
            List<Goal> currentBatchGoals;

            if (existingBatchId != null && !existingBatchId.isBlank()) {
                currentBatchGoals = goalService.getAssignedGoalsByBatch(actor.getId(), existingBatchId);
            } else {
                currentBatchGoals = new ArrayList<>();
                currentBatchGoals.add(existingGoal);
            }

            Map<Long, Goal> currentByUserId = new HashMap<>();
            currentBatchGoals.forEach(goal -> currentByUserId.put(goal.getUser().getId(), goal));

            Set<Long> targetIds = new HashSet<>();
            targets.forEach(user -> targetIds.add(user.getId()));

            String targetBatchId = targets.size() > 1
                    ? (existingBatchId != null && !existingBatchId.isBlank() ? existingBatchId : UUID.randomUUID().toString())
                    : null;

            Goal representative = null;

            for (PersonalUser target : targets) {
                Goal goalForTarget = currentByUserId.get(target.getId());

                if (goalForTarget == null) {
                    goalForTarget = goalService.createGoal(request, target);
                    goalForTarget.setAssignedByAdmin((AdminUser) actor);
                }

                goalForTarget.setAssignmentBatchId(targetBatchId);
                Goal saved = goalService.updateGoal(goalForTarget, request);

                if (representative == null) {
                    representative = saved;
                }
            }

            for (Goal goal : currentBatchGoals) {
                if (!targetIds.contains(goal.getUser().getId())) {
                    goalService.deleteById(goal.getId());
                }
            }

            return ResponseEntity.ok(representative);
        }

        return ResponseEntity.ok(goalService.updateGoal(existingGoal, request));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<?> updateGoalProgress(@RequestHeader("Authorization") String token,
                                                @RequestHeader(value = "Accept-Language", required = false) String language,
                                                @PathVariable Integer id,
                                                @RequestBody GoalProgressRequest request) {
        User actor = getActor(token, language);
        Goal goal = goalService.findById(id);

        if (goal == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, languageResolver.text(language, "goal.notFound"));
        }

        if (!canAccessGoal(actor, goal)) {
            throw new SecurityException(languageResolver.text(language, "goal.noAccess"));
        }

        return ResponseEntity.ok(goalService.updateGoalProgress(goal, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGoal(@RequestHeader("Authorization") String token,
                                        @RequestHeader(value = "Accept-Language", required = false) String language,
                                        @PathVariable Integer id) {
        User actor = getActor(token, language);
        Goal goal = goalService.findById(id);

        if (goal == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, languageResolver.text(language, "goal.notFound"));
        }

        if (!canAccessGoal(actor, goal)) {
            throw new SecurityException(languageResolver.text(language, "goal.noAccess"));
        }

        if (!actor.isAdmin() && goal.isAssignedByAdmin()) {
            throw new SecurityException("No puedes eliminar objetivos asignados por administrador.");
        }

        goalService.deleteById(id);
        return ResponseEntity.ok(languageResolver.text(language, "goal.deleted"));
    }

    private User getActor(String token, String language) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        User actor = userService.getUserByUsername(username);
        if (actor == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, languageResolver.text(language, "user.notFound"));
        }
        return actor;
    }

    private List<PersonalUser> resolveTargetUsers(User actor, GoalRequest request) {
        if (!actor.isAdmin()) {
            return actor instanceof PersonalUser personalActor ? List.of(personalActor) : List.of();
        }

        if (Boolean.TRUE.equals(request.getAssignToAllUsers())) {
            List<PersonalUser> users = userService.getUsersInAdminScope(actor).stream()
                    .filter(PersonalUser.class::isInstance)
                    .map(PersonalUser.class::cast)
                    .toList();
            if (users.isEmpty()) {
                throw new SecurityException("No hay usuarios subordinados para asignar.");
            }
            return users;
        }

        if (request.getTargetUserIds() != null && !request.getTargetUserIds().isEmpty()) {
            return request.getTargetUserIds().stream()
                    .map(userService::getUserById)
                    .filter(PersonalUser.class::isInstance)
                    .map(PersonalUser.class::cast)
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
            return managedUser instanceof PersonalUser personalUser ? List.of(personalUser) : List.of();
        }

        throw new SecurityException("Debes seleccionar al menos un usuario.");
    }

    private boolean canAccessManagedUser(User actor, User target) {
        if (actor == null || !actor.isAdmin() || target == null) {
            return false;
        }

        return userService.getUsersInAdminScope(actor).stream()
                .anyMatch(user -> user.getId().equals(target.getId()));
    }

    private boolean canAccessGoal(User actor, Goal goal) {
        if (goal.getUser().getId().equals(actor.getId())) {
            return true;
        }

        return actor.isAdmin()
                && goal.getAssignedByAdmin() != null
                && goal.getAssignedByAdmin().getId().equals(actor.getId())
                && canAccessManagedUser(actor, goal.getUser());
    }
}
