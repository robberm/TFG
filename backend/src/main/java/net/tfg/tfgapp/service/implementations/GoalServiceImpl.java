package net.tfg.tfgapp.service.implementations;

import net.tfg.tfgapp.DTOs.objectives.GoalProgressRequest;
import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.ObjectiveAssignment;
import net.tfg.tfgapp.domains.ObjectiveLog;
import net.tfg.tfgapp.domains.PersonalUser;
import net.tfg.tfgapp.enumerates.GoalStatus;
import net.tfg.tfgapp.enumerates.ObjectivePriority;
import net.tfg.tfgapp.repos.GoalRepo;
import net.tfg.tfgapp.repos.ObjectiveLogRepo;
import net.tfg.tfgapp.service.interfaces.IGoalService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class GoalServiceImpl extends ObjectiveServiceBase<Goal, GoalRepo> implements IGoalService {

    private final GoalRepo goalRepo;
    private final ObjectiveLogRepo objectiveLogRepo;

    public GoalServiceImpl(GoalRepo goalRepo, ObjectiveLogRepo objectiveLogRepo) {
        super(goalRepo);
        this.goalRepo = goalRepo;
        this.objectiveLogRepo = objectiveLogRepo;
    }

    @Override
    public List<Goal> getByUsername(String username) {
        List<Goal> goals = goalRepo.findByUserUsername(username);
        goals.forEach(goal -> selectAssignmentByUsername(goal, username));
        return goals;
    }

    @Override
    public Goal createGoal(GoalRequest request, PersonalUser user) {
        Goal goal = new Goal();
        applyGoalDetails(goal, request);
        goal.setUser(user);
        goal.addAssignment(user, null);

        Goal savedGoal = goalRepo.save(goal);

        if (savedGoal.isNumeric()) {
            ObjectiveLog initialLog = new ObjectiveLog();
            initialLog.setObjective(savedGoal);
            initialLog.setObjectiveAssignment(resolveAssignment(savedGoal));
            initialLog.setLogDate(LocalDate.now());
            initialLog.setProgressValue(savedGoal.getValorProgreso());
            initialLog.setNotes("Creación inicial del objetivo.");
            objectiveLogRepo.save(initialLog);
        }

        return savedGoal;
    }

    @Override
    public Goal updateGoal(Goal existingGoal, GoalRequest request) {
        applyGoalDetails(existingGoal, request);
        return goalRepo.save(existingGoal);
    }

    @Override
    public void applyGoalDetails(Goal goal, GoalRequest request) {
        goal.setTitulo(request.getTitulo());
        goal.setDescription(request.getDescription());
        goal.setPriority(request.getPriority() != null ? request.getPriority() : ObjectivePriority.Media);
        goal.setStatus(request.getStatus() != null ? request.getStatus() : GoalStatus.NotStarted);
        goal.setNumeric(request.isNumeric());
        goal.setActive(request.getActive() == null || request.getActive());

        if (request.isNumeric()) {
            goal.setValorObjetivo(request.getValorObjetivo());
            goal.setValorProgreso(request.getValorProgreso() != null ? request.getValorProgreso() : 0.0);
        } else {
            goal.setValorObjetivo(null);
            goal.setValorProgreso(null);
        }
    }

    @Override
    public Goal updateGoalProgress(Goal goal, GoalProgressRequest request) {
        goal.setValorProgreso(request.getValorProgreso());
        ObjectiveAssignment currentAssignment = resolveAssignment(goal);
        currentAssignment.setProgressValue(request.getValorProgreso());

        LocalDate today = LocalDate.now();
        ObjectiveLog log = objectiveLogRepo
                .findByObjectiveAssignmentIdAndLogDate(resolveAssignmentId(goal), today)
                .orElseGet(() -> {
                    ObjectiveLog newLog = new ObjectiveLog();
                    newLog.setObjective(goal); // legacy/trazabilidad
                    newLog.setObjectiveAssignment(currentAssignment);
                    newLog.setLogDate(today);
                    return newLog;
                });

        log.setProgressValue(request.getValorProgreso());
        log.setNotes(request.getNotes());

        objectiveLogRepo.save(log);

        return goalRepo.save(goal);
    }

    @Override
    public List<Goal> getAssignedGoalsForAdmin(Long adminId) {
        return goalRepo.findByAssignedByAdmin_Id(adminId);
    }

    @Override
    public List<Goal> getAssignedGoalsForAdminAndUser(Long adminId, Long userId) {
        List<Goal> goals = goalRepo.findByAssignedByAdmin_IdAndUser_Id(adminId, userId);
        goals.forEach(goal -> goal.getAssignments().stream()
                .filter(a -> a.getPersonalUser().getId().equals(userId))
                .findFirst()
                .ifPresent(goal::setCurrentAssignment));
        return goals;
    }

    private void selectAssignmentByUsername(Goal goal, String username) {
        goal.getAssignments().stream()
                .filter(a -> a.getPersonalUser().getUsername().equals(username))
                .findFirst()
                .ifPresent(goal::setCurrentAssignment);
    }

    private Integer resolveAssignmentId(Goal goal) {
        return resolveAssignment(goal).getId();
    }

    private ObjectiveAssignment resolveAssignment(Goal goal) {
        if (goal.getCurrentAssignment() != null) {
            return goal.getCurrentAssignment();
        }
        if (goal.getAssignments().isEmpty()) {
            throw new IllegalStateException("La meta no tiene asignación asociada.");
        }
        return goal.getAssignments().get(0);
    }
}
