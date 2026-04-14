package net.tfg.tfgapp.service.implementations;

import net.tfg.tfgapp.DTOs.objectives.GoalRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateOrganizationRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateUserRequest;
import net.tfg.tfgapp.DTOs.users.UserSummaryResponse;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.Organization;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.enumerates.GoalStatus;
import net.tfg.tfgapp.enumerates.ObjectivePriority;
import net.tfg.tfgapp.enumerates.UserRole;
import net.tfg.tfgapp.repos.EventRepo;
import net.tfg.tfgapp.repos.GoalRepo;
import net.tfg.tfgapp.repos.OrganizationRepo;
import net.tfg.tfgapp.service.interfaces.IAdminService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import net.tfg.tfgapp.validation.PasswordPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminServiceImpl implements IAdminService {

    private final IUserService userService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final OrganizationRepo organizationRepo;
    private final GoalRepo goalRepo;
    private final EventRepo eventRepo;

    public AdminServiceImpl(IUserService userService,
                            PasswordEncoder passwordEncoder,
                            PasswordPolicy passwordPolicy,
                            OrganizationRepo organizationRepo,
                            GoalRepo goalRepo,
                            EventRepo eventRepo) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.organizationRepo = organizationRepo;
        this.goalRepo = goalRepo;
        this.eventRepo = eventRepo;
    }

    @Override
    public UserSummaryResponse createManagedUser(String adminUsername, AdminCreateUserRequest request) {
        User admin = getValidatedAdmin(adminUsername);

        if (request == null) {
            throw new IllegalArgumentException("Request inválida.");
        }

        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new IllegalArgumentException("El username no puede estar vacío.");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía.");
        }

        Organization organization = admin.getOrganization();
        if (organization == null) {
            throw new IllegalStateException("El administrador no tiene una organización asociada.");
        }

        if (userService.existsByUsername(request.getUsername().trim())) {
            throw new IllegalArgumentException("El username ya existe.");
        }

        passwordPolicy.validateOrThrow(request.getPassword());

        User managedUser = new User();
        managedUser.setUsername(request.getUsername().trim());
        managedUser.setPassword(passwordEncoder.encode(request.getPassword()));
        managedUser.setTokenVersion(0);
        managedUser.setRole(UserRole.PERSONAL);
        managedUser.setOrganization(organization);
        managedUser.setCreatedByAdmin(admin);

        User savedUser = userService.save(managedUser);
        return UserSummaryResponse.fromUser(savedUser);
    }

    @Override
    public void deleteManagedUser(String adminUsername, Long userId) {
        User admin = getValidatedAdmin(adminUsername);

        if (userId == null) {
            throw new IllegalArgumentException("El identificador del usuario es obligatorio.");
        }

        User managedUser = userService.getManagedUser(admin.getId(), userId);
        if (managedUser == null) {
            throw new IllegalArgumentException("No se ha encontrado ningún usuario subordinado con ese id.");
        }

        if (managedUser.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("No se puede eliminar otro administrador desde este flujo.");
        }

        userService.delete(managedUser);
    }

    @Override
    public List<UserSummaryResponse> getManagedUsers(String adminUsername) {
        User admin = getValidatedAdmin(adminUsername);

        return userService.getManagedUsers(admin.getId())
                .stream()
                .map(UserSummaryResponse::fromUser)
                .toList();
    }

    @Override
    public Organization createOrganizationForAdmin(String adminUsername, AdminCreateOrganizationRequest request) {
        User admin = getValidatedAdmin(adminUsername);

        if (request == null || request.getOrganizationName() == null || request.getOrganizationName().isBlank()) {
            throw new IllegalArgumentException("El nombre de la organización es obligatorio.");
        }

        if (admin.getOrganization() != null) {
            throw new IllegalStateException("El administrador ya tiene una organización asociada.");
        }

        String organizationName = request.getOrganizationName().trim();

        if (organizationRepo.existsByNameIgnoreCase(organizationName)) {
            throw new IllegalArgumentException("Ya existe una organización con ese nombre.");
        }

        Organization organization = new Organization();
        organization.setName(organizationName);
        organization.setAdmin(admin);

        Organization savedOrganization = organizationRepo.save(organization);

        admin.setOrganization(savedOrganization);
        userService.save(admin);

        return savedOrganization;
    }

    @Override
    public List<Goal> getManagedUserGoals(String adminUsername, Long userId) {
        User managedUser = getManagedUserForAdmin(adminUsername, userId);
        return goalRepo.findByUser_Id(managedUser.getId());
    }

    @Override
    public Goal createManagedUserGoal(String adminUsername, Long userId, GoalRequest request) {
        User managedUser = getManagedUserForAdmin(adminUsername, userId);

        if (request == null || request.getTitulo() == null || request.getTitulo().isBlank()) {
            throw new IllegalArgumentException("El título del goal es obligatorio.");
        }

        Goal goal = new Goal();
        goal.setTitulo(request.getTitulo().trim());
        goal.setDescription(request.getDescription());
        goal.setPriority(request.getPriority() != null ? request.getPriority() : ObjectivePriority.Media);
        goal.setStatus(request.getStatus() != null ? request.getStatus() : GoalStatus.NotStarted);
        goal.setNumeric(request.isNumeric());
        goal.setActive(request.getActive() == null || request.getActive());
        goal.setUser(managedUser);

        if (request.isNumeric()) {
            goal.setValorObjetivo(request.getValorObjetivo());
            goal.setValorProgreso(request.getValorProgreso() != null ? request.getValorProgreso() : 0.0);
        } else {
            goal.setValorObjetivo(null);
            goal.setValorProgreso(null);
        }

        return goalRepo.save(goal);
    }

    @Override
    public Goal updateManagedUserGoal(String adminUsername, Long userId, Integer goalId, GoalRequest request) {
        getManagedUserForAdmin(adminUsername, userId);

        if (goalId == null) {
            throw new IllegalArgumentException("El id del goal es obligatorio.");
        }

        if (request == null || request.getTitulo() == null || request.getTitulo().isBlank()) {
            throw new IllegalArgumentException("El título del goal es obligatorio.");
        }

        Goal goal = goalRepo.findByIdAndUser_Id(goalId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Goal no encontrado para el usuario indicado."));

        goal.setTitulo(request.getTitulo().trim());
        goal.setDescription(request.getDescription());
        goal.setPriority(request.getPriority() != null ? request.getPriority() : goal.getPriority());
        goal.setStatus(request.getStatus() != null ? request.getStatus() : goal.getStatus());
        goal.setNumeric(request.isNumeric());
        goal.setActive(request.getActive() == null || request.getActive());

        if (request.isNumeric()) {
            goal.setValorObjetivo(request.getValorObjetivo());
            goal.setValorProgreso(request.getValorProgreso());
        } else {
            goal.setValorObjetivo(null);
            goal.setValorProgreso(null);
        }

        return goalRepo.save(goal);
    }

    @Override
    public void deleteManagedUserGoal(String adminUsername, Long userId, Integer goalId) {
        getManagedUserForAdmin(adminUsername, userId);

        Goal goal = goalRepo.findByIdAndUser_Id(goalId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Goal no encontrado para el usuario indicado."));

        goalRepo.delete(goal);
    }

    @Override
    public List<Event> getManagedUserEvents(String adminUsername, Long userId, LocalDateTime start, LocalDateTime end) {
        User managedUser = getManagedUserForAdmin(adminUsername, userId);

        if (start != null && end != null) {
            return eventRepo.findEventsByUserIdAndDateRange(managedUser.getId(), start, end);
        }

        return eventRepo.findEventsByUserId(managedUser.getId());
    }

    @Override
    public Event createManagedUserEvent(String adminUsername, Long userId, Event event) {
        User managedUser = getManagedUserForAdmin(adminUsername, userId);

        if (event == null || event.getTitle() == null || event.getTitle().isBlank()) {
            throw new IllegalArgumentException("El título del evento es obligatorio.");
        }

        if (event.getStartTime() == null || event.getEndTime() == null || !event.getEndTime().isAfter(event.getStartTime())) {
            throw new IllegalArgumentException("El rango de fechas del evento no es válido.");
        }

        event.setId(null);
        event.setUser(managedUser);
        return eventRepo.save(event);
    }

    @Override
    public Event updateManagedUserEvent(String adminUsername, Long userId, Long eventId, Event eventDetails) {
        getManagedUserForAdmin(adminUsername, userId);

        Event event = eventRepo.findByIdAndUser_Id(eventId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Evento no encontrado para el usuario indicado."));

        event.setTitle(eventDetails.getTitle());
        event.setDescription(eventDetails.getDescription());
        event.setStartTime(eventDetails.getStartTime());
        event.setEndTime(eventDetails.getEndTime());
        event.setLocation(eventDetails.getLocation());
        event.setCategory(eventDetails.getCategory());
        event.setIsAllDay(eventDetails.getIsAllDay());
        event.setReminderMinutesBefore(eventDetails.getReminderMinutesBefore());

        if (event.getStartTime() == null || event.getEndTime() == null || !event.getEndTime().isAfter(event.getStartTime())) {
            throw new IllegalArgumentException("El rango de fechas del evento no es válido.");
        }

        return eventRepo.save(event);
    }

    @Override
    public void deleteManagedUserEvent(String adminUsername, Long userId, Long eventId) {
        getManagedUserForAdmin(adminUsername, userId);

        Event event = eventRepo.findByIdAndUser_Id(eventId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Evento no encontrado para el usuario indicado."));

        eventRepo.delete(event);
    }

    private User getValidatedAdmin(String adminUsername) {
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new IllegalArgumentException("Admin inválido.");
        }

        User admin = userService.getUserByUsername(adminUsername);
        if (admin == null) {
            throw new IllegalArgumentException("Admin no encontrado.");
        }

        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("No tienes permisos de administrador.");
        }

        return admin;
    }

    private User getManagedUserForAdmin(String adminUsername, Long userId) {
        User admin = getValidatedAdmin(adminUsername);

        if (userId == null) {
            throw new IllegalArgumentException("El id de usuario subordinado es obligatorio.");
        }

        User managedUser = userService.getManagedUser(admin.getId(), userId);
        if (managedUser == null) {
            throw new IllegalArgumentException("No tienes permisos sobre ese usuario subordinado.");
        }

        return managedUser;
    }
}
