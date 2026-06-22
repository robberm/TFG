package net.tfg.tfgapp.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import net.tfg.tfgapp.domains.AdminUser;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.EventAssignment;
import net.tfg.tfgapp.domains.Objective;
import net.tfg.tfgapp.domains.ObjectiveAssignment;
import net.tfg.tfgapp.domains.PersonalUser;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.repos.PersonalUserRepo;
import net.tfg.tfgapp.repos.UserRepo;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.logging.Logger;

@Service
public class UserService implements IUserService {

    private static final Logger LOG = Logger.getLogger(UserService.class.getName());

    private final UserRepo uRepo;
    private final PersonalUserRepo personalUserRepo;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepo uRepo, PersonalUserRepo personalUserRepo) {
        this.uRepo = uRepo;
        this.personalUserRepo = personalUserRepo;
    }

    @Override
    public <S extends User> S save(S entity) {
        return uRepo.save(entity);
    }

    @Override
    public List<User> findAll() {
        return uRepo.findAll();
    }

    @Override
    public User getUserByUsername(String username) {
        return uRepo.findByUsername(username);
    }

    @Override
    public User getUserById(Long id) {
        return uRepo.findById(id).orElse(null);
    }

    @Override
    public boolean existsByUsername(String username) {
        try {
            return uRepo.existsByUsername(username);
        } catch (Exception e) {
            LOG.warning("Error al comprobar unicidad de usuario");
            return true;
        }
    }

    @Override
    public List<User> getManagedUsers(Long adminId) {
        List<User> managedUsers = new java.util.ArrayList<>();
        for (PersonalUser personalUser : personalUserRepo.findByAudAdmin_Id(adminId)) {
            managedUsers.add(personalUser);
        }
        return managedUsers;
    }

    @Override
    public User getManagedUser(Long adminId, Long userId) {
        Optional<PersonalUser> managedUser = personalUserRepo.findByIdAndAudAdmin_Id(userId, adminId);
        return managedUser.isPresent() ? managedUser.get() : null;
    }


    @Override
    public List<User> getUsersInAdminScope(User admin) {
        if (!(admin instanceof AdminUser adminUser)) {
            return List.of();
        }

        if (adminUser.getAdministeredOrganization() != null) {
            List<User> organizationUsers = new java.util.ArrayList<>();
            for (PersonalUser personalUser : personalUserRepo.findByOrganization_Id(adminUser.getAdministeredOrganization().getId())) {
                organizationUsers.add(personalUser);
            }
            return organizationUsers;
        }

        return getManagedUsers(admin.getId());
    }

    @Override
    @Transactional
    public void delete(User user) {
        if (user instanceof PersonalUser personalUser) {
            PersonalUser managedUser = cleanupPersonalUserDependencies(personalUser);
            if (managedUser != null) {
                uRepo.delete(managedUser);
                return;
            }
        }
        uRepo.delete(user);
    }

    private PersonalUser cleanupPersonalUserDependencies(PersonalUser personalUser) {
        PersonalUser managedUser = entityManager.contains(personalUser)
                ? personalUser
                : entityManager.find(PersonalUser.class, personalUser.getId());

        if (managedUser == null) {
            return null;
        }

        detachEventAssignments(managedUser);
        Set<Integer> removedObjectiveIds = detachObjectiveAssignments(managedUser);
        reassignOrDeleteOwnedObjectives(managedUser, removedObjectiveIds);
        entityManager.flush();
        return managedUser;
    }

    private void detachEventAssignments(PersonalUser personalUser) {
        List<EventAssignment> assignments = new ArrayList<>(personalUser.getEventAssignments());
        for (EventAssignment assignment : assignments) {
            Event event = assignment.getEvent();
            if (event == null) {
                continue;
            }

            event.getAssignments().remove(assignment);
            removeAssignment(assignment);

            if (event.getAssignments().isEmpty()) {
                entityManager.remove(entityManager.contains(event) ? event : entityManager.merge(event));
            } else {
                entityManager.merge(event);
            }
        }
    }

    private Set<Integer> detachObjectiveAssignments(PersonalUser personalUser) {
        Set<Integer> removedObjectiveIds = new HashSet<>();
        List<ObjectiveAssignment> assignments = new ArrayList<>(personalUser.getObjectiveAssignments());
        for (ObjectiveAssignment assignment : assignments) {
            Objective objective = assignment.getObjective();
            if (objective == null) {
                continue;
            }

            objective.getAssignments().remove(assignment);
            removeAssignment(assignment);
            reassignObjectiveOwnerIfNeeded(objective, personalUser);

            if (objective.getAssignments().isEmpty()) {
                removedObjectiveIds.add(objective.getId());
                removeObjective(objective);
            } else {
                entityManager.merge(objective);
            }
        }
        return removedObjectiveIds;
    }

    private void reassignOrDeleteOwnedObjectives(PersonalUser personalUser, Set<Integer> removedObjectiveIds) {
        List<Objective> ownedObjectives = new ArrayList<>(personalUser.getObjetivos());
        for (Objective objective : ownedObjectives) {
            if (objective.getId() != null && removedObjectiveIds.contains(objective.getId())) {
                continue;
            }

            if (!entityManager.contains(objective)) {
                objective = entityManager.merge(objective);
            }

            if (objective.getAssignments().isEmpty()) {
                removedObjectiveIds.add(objective.getId());
                removeObjective(objective);
                continue;
            }

            reassignObjectiveOwnerIfNeeded(objective, personalUser);

            if (objective.getUser() != null && objective.getUser().getId().equals(personalUser.getId())) {
                removedObjectiveIds.add(objective.getId());
                removeObjective(objective);
            } else {
                entityManager.merge(objective);
            }
        }
    }

    private void reassignObjectiveOwnerIfNeeded(Objective objective, PersonalUser deletedUser) {
        if (objective.getUser() == null || !objective.getUser().getId().equals(deletedUser.getId())) {
            return;
        }

        for (ObjectiveAssignment assignment : objective.getAssignments()) {
            PersonalUser replacement = assignment.getPersonalUser();
            if (replacement != null && !replacement.getId().equals(deletedUser.getId())) {
                objective.setUser(replacement);
                return;
            }
        }
    }

    private void removeObjective(Objective objective) {
        entityManager.remove(entityManager.contains(objective) ? objective : entityManager.merge(objective));
    }

    private void removeAssignment(Object assignment) {
        entityManager.remove(entityManager.contains(assignment) ? assignment : entityManager.merge(assignment));
    }
}
