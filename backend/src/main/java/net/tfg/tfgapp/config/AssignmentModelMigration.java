package net.tfg.tfgapp.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Migración puente para pasar del modelo "una fila por usuario" al modelo con asignaciones.
 *
 * Cuando compruebes en BBDD que `event_assignments` y `objective_assignments` están pobladas,
 * esta clase se puede borrar.
 */
@Component
public class AssignmentModelMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public AssignmentModelMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        migrateEventAssignments();
        migrateObjectiveAssignments();
        migrateObjectiveLogs();
    }

    private void migrateEventAssignments() {
        if (tableExists("events") && tableExists("event_assignments") && columnExists("events", "user_id")) {
            jdbcTemplate.update("""
                    INSERT IGNORE INTO event_assignments (event_id, personal_user_id, assigned_by_admin_id, assigned_at)
                    SELECT id, user_id, assigned_by_admin_id, NOW()
                    FROM events
                    WHERE user_id IS NOT NULL
                    """);
        }
    }

    private void migrateObjectiveAssignments() {
        if (tableExists("objectives") && tableExists("objective_assignments") && columnExists("objectives", "user_id")) {
            jdbcTemplate.update("""
                    INSERT IGNORE INTO objective_assignments (
                        objective_id, personal_user_id, assigned_by_admin_id, status, active,
                        progress_value, target_value, assigned_at
                    )
                    SELECT o.id, o.user_id, o.assigned_by_admin_id, COALESCE(g.status, 'NotStarted'),
                           COALESCE(o.active, true), g.valor_progreso, g.valor_objetivo, NOW()
                    FROM objectives o
                    LEFT JOIN goals g ON g.id = o.id
                    WHERE o.user_id IS NOT NULL
                    """);
        }
    }

    private void migrateObjectiveLogs() {
        if (tableExists("objective_logs") && tableExists("objective_assignments")
                && columnExists("objective_logs", "objective_assignment_id") && columnExists("objective_logs", "objective_id")) {
            jdbcTemplate.update("""
                    UPDATE objective_logs l
                    JOIN objective_assignments a ON a.objective_id = l.objective_id
                    SET l.objective_assignment_id = a.id
                    WHERE l.objective_assignment_id IS NULL
                    """);
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = DATABASE() AND table_name = ?
                """, Integer.class, tableName);
        return count != null && count > 0;
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
                """, Integer.class, tableName, columnName);
        return count != null && count > 0;
    }
}
