package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoalRepo extends JpaRepository<Goal, Integer> {

    List<Goal> findByUserUsername(String username);

    List<Goal> findByUser_Id(Long userId);

    Optional<Goal> findByIdAndUser_Id(Integer goalId, Long userId);
}
