package net.tfg.tfgapp.service.interfaces;

import net.tfg.tfgapp.DTOs.ChangePasswordRequest;
import net.tfg.tfgapp.DTOs.ChangeUsernameRequest;
import net.tfg.tfgapp.DTOs.LoginRequest;
import net.tfg.tfgapp.domains.User;

public interface AccountService {

    boolean authenticate(LoginRequest loginRequest);

    User register(User newUser);

    User changePassword(String tokenUsername, ChangePasswordRequest request);

    User changeUsername(String tokenUsername, ChangeUsernameRequest request);
}