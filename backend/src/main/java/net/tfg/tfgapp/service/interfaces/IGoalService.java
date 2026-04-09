package net.tfg.tfgapp.service.interfaces;

import net.tfg.tfgapp.DTOs.objectives.GoalProgressRequest;
import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.User;

public interface IGoalService extends IObjectiveService<Goal> {

    Goal createGoal(GoalRequest request, User user);

    Goal updateGoal(Goal existingGoal, GoalRequest request);

    Goal updateGoalProgress(Goal goal, GoalProgressRequest request);
}