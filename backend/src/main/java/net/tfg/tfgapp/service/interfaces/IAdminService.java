package net.tfg.tfgapp.service.interfaces;

import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateOrganizationRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateUserRequest;
import net.tfg.tfgapp.DTOs.users.UserSummaryResponse;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.Organization;

import java.time.LocalDateTime;
import java.util.List;

public interface IAdminService {

    UserSummaryResponse createManagedUser(String adminUsername, AdminCreateUserRequest request);

    void deleteManagedUser(String adminUsername, Long userId);

    List<UserSummaryResponse> getManagedUsers(String adminUsername);

    Organization createOrganizationForAdmin(String adminUsername, AdminCreateOrganizationRequest request);

    List<Goal> getManagedUserGoals(String adminUsername, Long userId);

    Goal createManagedUserGoal(String adminUsername, Long userId, GoalRequest request);

    Goal updateManagedUserGoal(String adminUsername, Long userId, Integer goalId, GoalRequest request);

    void deleteManagedUserGoal(String adminUsername, Long userId, Integer goalId);

    List<Event> getManagedUserEvents(String adminUsername, Long userId, LocalDateTime start, LocalDateTime end);

    Event createManagedUserEvent(String adminUsername, Long userId, Event event);

    Event updateManagedUserEvent(String adminUsername, Long userId, Long eventId, Event eventDetails);

    void deleteManagedUserEvent(String adminUsername, Long userId, Long eventId);
}
