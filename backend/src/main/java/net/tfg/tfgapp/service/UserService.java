package net.tfg.tfgapp.service;


import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.repos.UserRepo;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;

@Service
public class UserService implements IUserService {

    private static final Logger LOG = Logger.getLogger(UserService.class.getName());

    private final UserRepo uRepo;

    public UserService(UserRepo uRepo) {
        this.uRepo = uRepo;
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
    public boolean existsByUsername(String username) {
        try {
            return uRepo.findByUsername(username) != null;
        } catch (Exception e) {
            LOG.warning("Error al comprobar unicidad de usuario");
            return true;
        }
    }
}