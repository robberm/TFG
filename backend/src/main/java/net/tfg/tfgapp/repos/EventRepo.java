package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.domains.Objectives;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepo extends JpaRepository<Event, Long> {
//Pongo mejor Long por si fuera escalable



    @Query("SELECT e FROM Event e WHERE e.startTime >= :start AND e.endTime <= :end")
    List<Event> findEventsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);


    @Query("SELECT e FROM Event e WHERE e.user.username = :username AND e.startTime >= :start AND e.endTime <= :end")
    public List<Event> findEventsByUserAndDateRange(@Param("username") String username,
                                                    @Param("start") LocalDateTime start,
                                                    @Param("end") LocalDateTime end);


    List<Event> findByCategory(String category);


    @Query("SELECT o FROM Event o WHERE o.user.username = :username")
    public List<Event> findEventsByUser(@Param("username") String username);

    @Query("SELECT e FROM Event e WHERE FUNCTION('DATE', e.startTime) = FUNCTION('DATE', :date)")
    List<Event> findByStartDate(@Param("date") LocalDateTime date);


    List<Event> findByStartTimeGreaterThanEqual(LocalDateTime now);
}

