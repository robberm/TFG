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
    @Query("""
            SELECT l FROM ObjectiveLog l
            LEFT JOIN FETCH l.objective
            LEFT JOIN FETCH l.objectiveAssignment a
            LEFT JOIN FETCH a.objective
            WHERE l.objective.id = :objectiveId
            ORDER BY l.logDate ASC
            """)
    List<ObjectiveLog> findByObjectiveIdOrderByLogDateAsc(@Param("objectiveId") Integer objectiveId);
    Optional<ObjectiveLog> findByObjectiveAssignmentIdAndLogDate(Integer objectiveAssignmentId, LocalDate logDate);
    @Query("""
            SELECT l FROM ObjectiveLog l
            LEFT JOIN FETCH l.objective
            LEFT JOIN FETCH l.objectiveAssignment a
            LEFT JOIN FETCH a.objective
            WHERE l.objectiveAssignment.id = :assignmentId
            ORDER BY l.logDate ASC
            """)
    List<ObjectiveLog> findByObjectiveAssignmentIdOrderByLogDateAsc(@Param("assignmentId") Integer assignmentId);
    @Query("""
            SELECT l FROM ObjectiveLog l
            LEFT JOIN FETCH l.objective
            LEFT JOIN FETCH l.objectiveAssignment a
            LEFT JOIN FETCH a.objective
            WHERE a.personalUser.username = :username
              AND l.logDate BETWEEN :startDate AND :endDate
            ORDER BY l.logDate ASC
            """)
    List<ObjectiveLog> findByObjectiveUserUsernameAndLogDateBetween(
            @Param("username") String username,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
