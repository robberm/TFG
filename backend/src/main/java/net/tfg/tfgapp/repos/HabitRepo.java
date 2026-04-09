package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitRepo extends JpaRepository<Habit, Integer> {

    List<Habit> findByUserUsername(String username);

    List<Habit> findByUserUsernameAndActiveTrue(String username);
}