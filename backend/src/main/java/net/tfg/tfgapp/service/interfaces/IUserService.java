package net.tfg.tfgapp.service.interfaces;


import net.tfg.tfgapp.domains.User;

import java.util.List;

public interface IUserService {

    <S extends User> S save(S entity);

    List<User> findAll();

    User getUserByUsername(String username);

    boolean existsByUsername(String username);
}