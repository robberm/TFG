package net.tfg.tfgapp.service.interfaces;

import net.tfg.tfgapp.DTOs.users.ChangePasswordRequest;
import net.tfg.tfgapp.DTOs.users.ChangeUsernameRequest;
import net.tfg.tfgapp.DTOs.users.LoginRequest;
import net.tfg.tfgapp.domains.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface AccountService {

    boolean authenticate(LoginRequest loginRequest);

    User register(User newUser);

    User changePassword(String tokenUsername, ChangePasswordRequest request);

    User changeUsername(String tokenUsername, ChangeUsernameRequest request);

    User updateProfileImage(String tokenUsername, MultipartFile file);

    User removeProfileImage(String tokenUsername);

    Map<String, Object> getProfileData(String tokenUsername);
}