package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.ObjectiveLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ObjectiveLogRepo extends JpaRepository<ObjectiveLog, Integer> {
    Optional<ObjectiveLog> findByObjectiveIdAndLogDate(Integer objectiveId, LocalDate logDate);
    List<ObjectiveLog> findByObjectiveIdOrderByLogDateAsc(Integer objectiveId);
    Optional<ObjectiveLog> findByObjectiveAssignmentIdAndLogDate(Integer objectiveAssignmentId, LocalDate logDate);
    @Query("""
            SELECT l FROM ObjectiveLog l
            WHERE l.objectiveAssignment.id = :assignmentId
            ORDER BY l.logDate ASC
            """)
    List<ObjectiveLog> findByObjectiveAssignmentIdOrderByLogDateAsc(@Param("assignmentId") Integer assignmentId);
    @Query("""
            SELECT l FROM ObjectiveLog l
            WHERE l.objectiveAssignment.personalUser.username = :username
              AND l.logDate BETWEEN :startDate AND :endDate
            ORDER BY l.logDate ASC
            """)
    List<ObjectiveLog> findByObjectiveUserUsernameAndLogDateBetween(String username, LocalDate startDate, LocalDate endDate);
}
