package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.Objectives;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Primary
@Repository
public interface ObjRepo extends JpaRepository<Objectives, Long> {

    @Query("SELECT o FROM Objectives o WHERE o.user.username = :username")
    public List<Objectives> findObjectiveByUser(@Param("username") String username);

}
