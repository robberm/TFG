package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.Objectives;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Primary
@Repository
public interface ObjRepo extends JpaRepository<Objectives, Long> {

}
