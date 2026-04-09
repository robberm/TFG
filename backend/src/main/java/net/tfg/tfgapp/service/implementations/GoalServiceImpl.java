package net.tfg.tfgapp.service.implementations;

import net.tfg.tfgapp.DTOs.objectives.GoalProgressRequest;
import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.ObjectiveLog;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.enumerates.GoalStatus;
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

    /**
     * Obtiene todos los objetivos grandes de un usuario.
     */
    @Override
    public List<Goal> getByUsername(String username) {
        return goalRepo.findByUserUsername(username);
    }

    /**
     * Crea un nuevo objetivo grande asociado al usuario autenticado.
     */
    @Override
    public Goal createGoal(GoalRequest request, User user) {
        Goal goal = new Goal();
        goal.setTitulo(request.getTitulo());
        goal.setDescription(request.getDescription());
        goal.setPriority(request.getPriority());
        goal.setStatus(request.getStatus() != null ? request.getStatus() : GoalStatus.NotStarted);
        goal.setNumeric(request.isNumeric());
        goal.setActive(request.getActive() == null || request.getActive());
        goal.setUser(user);

        if (request.isNumeric()) {
            goal.setValorObjetivo(request.getValorObjetivo());
            goal.setValorProgreso(request.getValorProgreso() != null ? request.getValorProgreso() : 0.0);
        } else {
            goal.setValorObjetivo(null);
            goal.setValorProgreso(null);
        }

        Goal savedGoal = goalRepo.save(goal);

        if (savedGoal.isNumeric()) {
            ObjectiveLog initialLog = new ObjectiveLog();
            initialLog.setObjective(savedGoal);
            initialLog.setLogDate(LocalDate.now());
            initialLog.setProgressValue(savedGoal.getValorProgreso());
            initialLog.setNotes("Creación inicial del objetivo.");
            objectiveLogRepo.save(initialLog);
        }

        return savedGoal;
    }

    /**
     * Actualiza los campos editables de un objetivo grande.
     */
    @Override
    public Goal updateGoal(Goal existingGoal, GoalRequest request) {
        existingGoal.setTitulo(request.getTitulo());
        existingGoal.setDescription(request.getDescription());
        existingGoal.setPriority(request.getPriority());
        existingGoal.setStatus(request.getStatus() != null ? request.getStatus() : existingGoal.getStatus());
        existingGoal.setNumeric(request.isNumeric());
        existingGoal.setActive(request.getActive() == null || request.getActive());

        if (request.isNumeric()) {
            existingGoal.setValorObjetivo(request.getValorObjetivo());
            existingGoal.setValorProgreso(request.getValorProgreso());
        } else {
            existingGoal.setValorObjetivo(null);
            existingGoal.setValorProgreso(null);
        }

        return goalRepo.save(existingGoal);
    }

    /**
     * Actualiza el progreso de un objetivo y registra el cambio en el histórico.
     */
    @Override
    public Goal updateGoalProgress(Goal goal, GoalProgressRequest request) {
        goal.setValorProgreso(request.getValorProgreso());

        ObjectiveLog log = new ObjectiveLog();
        log.setObjective(goal);
        log.setLogDate(LocalDate.now());
        log.setProgressValue(request.getValorProgreso());
        log.setNotes(request.getNotes());

        objectiveLogRepo.save(log);

        return goalRepo.save(goal);
    }
}