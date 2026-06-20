package net.tfg.tfgapp.service;

import net.tfg.tfgapp.domains.AdminUser;
import net.tfg.tfgapp.domains.PersonalUser;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.repos.PersonalUserRepo;
import net.tfg.tfgapp.repos.UserRepo;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;

@Service
public class UserService implements IUserService {

    private static final Logger LOG = Logger.getLogger(UserService.class.getName());

    private final UserRepo uRepo;
    private final PersonalUserRepo personalUserRepo;

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
        return personalUserRepo.findByCreatedByAdmin_Id(adminId).stream()
                .map(user -> (User) user)
                .toList();
    }

    @Override
    public User getManagedUser(Long adminId, Long userId) {
        return personalUserRepo.findByIdAndCreatedByAdmin_Id(userId, adminId)
                .map(user -> (User) user)
                .orElse(null);
    }


    @Override
    public List<User> getUsersInAdminScope(User admin) {
        if (!(admin instanceof AdminUser adminUser)) {
            return List.of();
        }

        if (adminUser.getAdministeredOrganization() != null) {
            return personalUserRepo.findByOrganization_Id(adminUser.getAdministeredOrganization().getId()).stream()
                    .map(user -> (User) user)
                    .toList();
        }

        return getManagedUsers(admin.getId());
    }

    @Override
    public void delete(User user) {
        uRepo.delete(user);
    }
}
