package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.ObjectiveLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ObjectiveLogRepo extends JpaRepository<ObjectiveLog, Integer> {

    Optional<ObjectiveLog> findByObjectiveIdAndLogDate(Integer objectiveId, LocalDate logDate);

    List<ObjectiveLog> findByObjectiveIdOrderByLogDateAsc(Integer objectiveId);

    List<ObjectiveLog> findByObjectiveUserUsernameAndLogDateBetween(
            String username,
            LocalDate startDate,
            LocalDate endDate
    );
}