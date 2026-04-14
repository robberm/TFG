package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.enumerates.UserRole;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Primary
@Repository
public interface UserRepo extends JpaRepository<User, Long> {

    User findByUsername(String username);

    boolean existsByUsername(String username);

    List<User> findByCreatedByAdmin_Id(Long adminId);

    Optional<User> findByIdAndCreatedByAdmin_Id(Long userId, Long adminId);

    List<User> findByOrganization_Id(Long organizationId);

    List<User> findByRole(UserRole role);
}