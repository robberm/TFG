package net.tfg.tfgapp.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.logging.Logger;

/**
 * Ajustes defensivos para esquemas locales actualizados con ddl-auto=update.
 * Hibernate no elimina columnas antiguas ni añade defaults a columnas legacy,
 * pero esas columnas pueden seguir siendo NOT NULL en bases ya existentes.
 */
@Component
public class LegacySchemaDefaults implements CommandLineRunner {

    private static final Logger LOG = Logger.getLogger(LegacySchemaDefaults.class.getName());

    private final JdbcTemplate jdbcTemplate;

    public LegacySchemaDefaults(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            ensureObjectivesNumericDefault();
        } catch (Exception e) {
            LOG.warning("No se pudo ajustar el default legacy de objectives.is_numeric: " + e.getMessage());
        }
    }

    private void ensureObjectivesNumericDefault() {
        Integer columnCount = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'objectives'
                          AND column_name = 'is_numeric'
                        """,
                Integer.class
        );

        if (columnCount == null || columnCount == 0) {
            return;
        }

        jdbcTemplate.update("UPDATE objectives SET is_numeric = FALSE WHERE is_numeric IS NULL");
        jdbcTemplate.execute("ALTER TABLE objectives MODIFY COLUMN is_numeric BOOLEAN NOT NULL DEFAULT FALSE");
    }
}
