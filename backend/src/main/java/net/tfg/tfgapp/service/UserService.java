package net.tfg.tfgapp.service;

import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.repos.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;

@Service
public class UserService {

    @Autowired
    private UserRepo uRepo;

    private static final Logger LOG = Logger.getLogger(UserService.class.getName());

    public <S extends User> S save(S entity) {
        return uRepo.save(entity);
    }

    public List<User> findAll() {
        return uRepo.findAll();
    }

    public User getUserByUsername(String username) {
        return uRepo.findByUsername(username);
    }

    public boolean existsByUsername(String username) {
        try {
            return uRepo.findByUsername(username) != null;
        } catch (Exception e) {
            LOG.warning("Error al comprobar unicidad de usuario");
            return true;
        }
    }
}