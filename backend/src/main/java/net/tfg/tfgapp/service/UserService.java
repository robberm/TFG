package net.tfg.tfgapp.service;

import net.tfg.tfgapp.domains.Objectives;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.repos.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class UserService {

    @Autowired
    private UserRepo uRepo;



    public <S extends User> S save(S entity) {
        return uRepo.save(entity);
    }


    public List<User> findAll() {
        return uRepo.findAll();
    }
}
