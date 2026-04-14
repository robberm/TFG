package net.tfg.tfgapp.service.interfaces;



import net.tfg.tfgapp.DTOs.users.AdminCreateUserRequest;
import net.tfg.tfgapp.DTOs.users.UserSummaryResponse;

import java.util.List;

public interface IAdminService {

    UserSummaryResponse createManagedUser(String adminUsername, AdminCreateUserRequest request);

    void deleteManagedUser(String adminUsername, Long userId);

    List<UserSummaryResponse> getManagedUsers(String adminUsername);
}