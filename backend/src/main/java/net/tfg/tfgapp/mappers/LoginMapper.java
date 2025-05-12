package net.tfg.tfgapp.mappers;

import net.tfg.tfgapp.DTOs.LoginRequest;
import net.tfg.tfgapp.domains.User;
import org.springframework.stereotype.Component;


@Component
public class LoginMapper {

    public static User toUser(LoginRequest loginRequest) {
        User user = new User();
        user.setUsername(loginRequest.getUsername());
        user.setPassword(loginRequest.getPassword());
        return user;
    }


    public LoginMapper() {}
}