package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.Objectives;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ObjRepo extends JpaRepository<Objectives, Long> {

}
