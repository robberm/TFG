package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalRepo extends JpaRepository<Goal, Integer> {

    List<Goal> findByUserUsername(String username);

    List<Goal> findByAssignedByAdmin_Id(Long adminId);

    List<Goal> findByAssignedByAdmin_IdAndUser_Id(Long adminId, Long userId);

}
