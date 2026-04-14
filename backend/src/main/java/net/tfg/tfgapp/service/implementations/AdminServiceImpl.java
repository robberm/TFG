package net.tfg.tfgapp.service;

import net.tfg.tfgapp.DTOs.users.AdminCreateOrganizationRequest;
import net.tfg.tfgapp.DTOs.users.AdminCreateUserRequest;
import net.tfg.tfgapp.DTOs.users.UserSummaryResponse;
import net.tfg.tfgapp.domains.Goal;
import net.tfg.tfgapp.domains.Organization;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.enumerates.UserRole;
import net.tfg.tfgapp.repos.OrganizationRepo;
import net.tfg.tfgapp.service.interfaces.IUserService;
import net.tfg.tfgapp.service.interfaces.IAdminService;
import net.tfg.tfgapp.service.interfaces.IGoalService;
import net.tfg.tfgapp.validation.PasswordPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminServiceImpl implements IAdminService {

    private final IUserService userService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;
    private final OrganizationRepo organizationRepo;
    private final IGoalService goalService;

    public AdminServiceImpl(IUserService userService,
                            PasswordEncoder passwordEncoder,
                            PasswordPolicy passwordPolicy,
                            OrganizationRepo organizationRepo,
                            IGoalService goalService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
        this.organizationRepo = organizationRepo;
        this.goalService = goalService;
    }

    /**
     * Crea un usuario personal subordinado al admin autenticado.
     * El usuario hereda la organización del admin.
     */
    @Override
    public UserSummaryResponse createManagedUser(String adminUsername, AdminCreateUserRequest request) {
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new IllegalArgumentException("Admin inválido.");
        }

        if (request == null) {
            throw new IllegalArgumentException("Request inválida.");
        }

        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new IllegalArgumentException("El username no puede estar vacío.");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía.");
        }

        User admin = userService.getUserByUsername(adminUsername);
        if (admin == null) {
            throw new IllegalArgumentException("Admin no encontrado.");
        }

        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("No tienes permisos de administrador.");
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

    /**
     * El admin únicamente puede borrar usuarios que él mismo haya creado.
     */
    @Override
    public void deleteManagedUser(String adminUsername, Long userId) {
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new IllegalArgumentException("Admin inválido.");
        }

        if (userId == null) {
            throw new IllegalArgumentException("El identificador del usuario es obligatorio.");
        }

        User admin = userService.getUserByUsername(adminUsername);
        if (admin == null) {
            throw new IllegalArgumentException("Admin no encontrado.");
        }

        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("No tienes permisos de administrador.");
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

    /**
     * Recupera los usuarios sobre los que el admin tiene control.
     */
    @Override
    public List<UserSummaryResponse> getManagedUsers(String adminUsername) {
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

        return userService.getManagedUsers(admin.getId())
                .stream()
                .map(UserSummaryResponse::fromUser)
                .toList();
    }

    @Override
    public Organization createOrganizationForAdmin(String adminUsername, AdminCreateOrganizationRequest request) {
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new IllegalArgumentException("Admin inválido.");
        }

        if (request == null || request.getOrganizationName() == null || request.getOrganizationName().isBlank()) {
            throw new IllegalArgumentException("El nombre de la organización es obligatorio.");
        }

        User admin = userService.getUserByUsername(adminUsername);
        if (admin == null) {
            throw new IllegalArgumentException("Admin no encontrado.");
        }

        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("No tienes permisos de administrador.");
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
    public List<Goal> getManagedUserGoals(String adminUsername, Long managedUserId) {
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new IllegalArgumentException("Admin inválido.");
        }

        if (managedUserId == null) {
            throw new IllegalArgumentException("El usuario subordinado es obligatorio.");
        }

        User admin = userService.getUserByUsername(adminUsername);
        if (admin == null) {
            throw new IllegalArgumentException("Admin no encontrado.");
        }

        if (admin.getRole() != UserRole.ADMIN) {
            throw new SecurityException("No tienes permisos de administrador.");
        }

        User managedUser = userService.getManagedUser(admin.getId(), managedUserId);
        if (managedUser == null) {
            throw new SecurityException("No tienes acceso a ese usuario subordinado.");
        }

        return goalService.getByUsername(managedUser.getUsername());
    }
}
