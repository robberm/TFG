package net.tfg.tfgapp.repos;

import net.tfg.tfgapp.domains.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepo extends JpaRepository<Event, Long> {

    /**
     * Obtiene eventos comprendidos completamente entre dos fechas.
     *
     * @param start fecha de inicio
     * @param end fecha de fin
     * @return lista de eventos del rango
     */
    @Query("SELECT e FROM Event e WHERE e.startTime >= :start AND e.endTime <= :end")
    List<Event> findEventsBetween(@Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);

    /**
     * Obtiene los eventos de un usuario que se solapan con el rango indicado.
     *
     * @param username username del usuario
     * @param start fecha de inicio
     * @param end fecha de fin
     * @return lista de eventos del usuario para ese rango
     */
    @Query("""
            SELECT e
            FROM Event e
            WHERE e.user.username = :username
              AND e.startTime >= :start
              AND e.endTime <= :end
            """)
    List<Event> findEventsByUserAndDateRange(@Param("username") String username,
                                             @Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);

    /**
     * Obtiene todos los eventos de un usuario.
     *
     * @param username username del usuario
     * @return lista de eventos del usuario
     */
    @Query("SELECT e FROM Event e WHERE e.user.username = :username")
    List<Event> findEventsByUser(@Param("username") String username);

    /**
     * Obtiene los eventos de un día concreto.
     *
     * @param date fecha objetivo
     * @return lista de eventos del día
     */
    @Query("SELECT e FROM Event e WHERE FUNCTION('DATE', e.startTime) = FUNCTION('DATE', :date)")
    List<Event> findByStartDate(@Param("date") LocalDateTime date);

    /**
     * Obtiene eventos futuros a partir del instante indicado.
     *
     * @param now instante de referencia
     * @return lista de eventos futuros
     */
    List<Event> findByStartTimeGreaterThanEqual(LocalDateTime now);

    /**
     * Comprueba si existe actualmente un evento activo de una categoría concreta
     * perteneciente al usuario indicado.
     *
     * @param category categoría del evento
     * @param now instante actual
     * @param userId id del usuario
     * @return true si existe un evento activo de esa categoría
     */
    @Query("""
            SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
            FROM Event e
            WHERE e.category = :category
              AND e.startTime <= :now
              AND e.endTime >= :now
              AND e.user.id = :userId
            """)
    boolean existsActiveEventOfCategory(@Param("category") Event.EventCategory category,
                                        @Param("now") LocalDateTime now,
                                        @Param("userId") Long userId);

    @Query("SELECT e FROM Event e WHERE e.user.id = :userId")
    List<Event> findEventsByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT e
            FROM Event e
            WHERE e.user.id = :userId
              AND e.startTime >= :start
              AND e.endTime <= :end
            """)
    List<Event> findEventsByUserIdAndDateRange(@Param("userId") Long userId,
                                               @Param("start") LocalDateTime start,
                                               @Param("end") LocalDateTime end);

    Optional<Event> findByIdAndUser_Id(Long eventId, Long userId);

    /**
     * Obtiene los eventos que todavía no han finalizado y que tienen un reminder
     * configurado, para poder programar sus avisos pendientes.
     *
     * @param now instante actual usado como referencia
     * @return lista de eventos con reminder aún pendientes de ejecución
     */
    @Query("""
        SELECT e
        FROM Event e
        WHERE e.reminderMinutesBefore IS NOT NULL
          AND e.endTime > :now
        ORDER BY e.startTime ASC
        """)
    List<Event> findPendingReminders(@Param("now") LocalDateTime now);
}

