package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.AdminUser;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminUserRepo extends JpaRepository<AdminUser, Long> {

    @EntityGraph(attributePaths = "administeredOrganization")
    Optional<AdminUser> findByUsername(String username);
}
