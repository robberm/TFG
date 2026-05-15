package net.tfg.tfgapp.service.implementations;

import net.tfg.tfgapp.DTOs.objectives.HabitCompletionRequest;
import net.tfg.tfgapp.DTOs.objectives.HabitRequest;
import net.tfg.tfgapp.domains.Habit;
import net.tfg.tfgapp.domains.ObjectiveLog;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.repos.HabitRepo;
import net.tfg.tfgapp.repos.ObjectiveLogRepo;
import net.tfg.tfgapp.service.interfaces.IHabitService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class HabitServiceImpl extends ObjectiveServiceBase<Habit, HabitRepo> implements IHabitService {

    private final HabitRepo habitRepo;
    private final ObjectiveLogRepo objectiveLogRepo;

    public HabitServiceImpl(HabitRepo habitRepo, ObjectiveLogRepo objectiveLogRepo) {
        super(habitRepo);
        this.habitRepo = habitRepo;
        this.objectiveLogRepo = objectiveLogRepo;
    }

    /**
     * Obtiene todos los hábitos de un usuario.
     */
    @Override
    public List<Habit> getByUsername(String username) {
        return habitRepo.findByUserUsername(username);
    }

    /**
     * Obtiene únicamente los hábitos activos de un usuario.
     */
    @Override
    public List<Habit> getActiveHabitsByUsername(String username) {
        return habitRepo.findByUserUsernameAndActiveTrue(username);
    }

    /**
     * Crea un nuevo hábito asociado al usuario autenticado.
     */
    @Override
    public Habit createHabit(HabitRequest request, User user) {
        Habit habit = new Habit();
        habit.setTitulo(request.getTitulo());
        habit.setDescription(request.getDescription());
        habit.setActive(request.getActive() == null || request.getActive());
        habit.setUser(user);

        return habitRepo.save(habit);
    }

    /**
     * Actualiza los campos editables de un hábito.
     */
    @Override
    public Habit updateHabit(Habit habit, HabitRequest request) {
        habit.setTitulo(request.getTitulo());
        habit.setDescription(request.getDescription());
        habit.setActive(request.getActive() == null || request.getActive());

        return habitRepo.save(habit);
    }

    /**
     * Registra o actualiza el estado de cumplimiento de un hábito en una fecha concreta.
     */
    @Override
    public ObjectiveLog markHabitCompletion(Habit habit, HabitCompletionRequest request) {
        LocalDate targetDate = request.getDate() != null ? request.getDate() : LocalDate.now();

        ObjectiveLog log = objectiveLogRepo
                .findByObjectiveIdAndLogDate(habit.getId(), targetDate)
                .orElseGet(() -> {
                    ObjectiveLog newLog = new ObjectiveLog();
                    newLog.setObjective(habit);
                    newLog.setLogDate(targetDate);
                    return newLog;
                });

        log.setCompleted(request.getCompleted());
        log.setNotes(request.getNotes());

        ObjectiveLog savedLog = objectiveLogRepo.save(log);
        recalculateHabitStreaks(habit);

        return savedLog;
    }

    /**
     * Recalcula las rachas de un hábito a partir de su histórico.
     */
    private void recalculateHabitStreaks(Habit habit) {
        List<ObjectiveLog> logs = objectiveLogRepo.findByObjectiveIdOrderByLogDateAsc(habit.getId());

        if (logs.isEmpty()) {
            habit.setCurrentStreak(0);
            habit.setBestStreak(0);
            habitRepo.save(habit);
            return;
        }

        int runningStreak = 0;
        int bestStreak = 0;
        LocalDate previousDate = null;

        for (ObjectiveLog log : logs) {
            LocalDate logDate = log.getLogDate();
            boolean isCompleted = Boolean.TRUE.equals(log.getCompleted());

            if (previousDate != null && ChronoUnit.DAYS.between(previousDate, logDate) > 1) {
                runningStreak = 0;
            }

            if (isCompleted) {
                runningStreak++;
                bestStreak = Math.max(bestStreak, runningStreak);
            } else {
                runningStreak = 0;
            }

            previousDate = logDate;
        }

        int currentStreak = calculateCurrentStreakEndingToday(logs);

        habit.setCurrentStreak(currentStreak);
        habit.setBestStreak(bestStreak);
        habitRepo.save(habit);
    }

    /**
     * Calcula la racha vigente de días consecutivos completados hasta hoy.
     */
    private int calculateCurrentStreakEndingToday(List<ObjectiveLog> logs) {
        int streak = 0;
        LocalDate expectedDate = LocalDate.now();

        for (int i = logs.size() - 1; i >= 0; i--) {
            ObjectiveLog log = logs.get(i);

            if (log.getLogDate().isAfter(expectedDate)) {
                continue;
            }

            if (!log.getLogDate().isEqual(expectedDate) || !Boolean.TRUE.equals(log.getCompleted())) {
                return streak;
            }

            streak++;
            expectedDate = expectedDate.minusDays(1);
        }

        return streak;
    }
}
