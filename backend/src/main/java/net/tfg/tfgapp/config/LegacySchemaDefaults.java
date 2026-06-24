package net.tfg.tfgapp.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.logging.Logger;

/**
 * Ajustes defensivos para esquemas locales actualizados con ddl-auto=update.
 * Hibernate no elimina columnas antiguas ni siempre corrige defaults de columnas
 * ya existentes, pero esas columnas pueden seguir siendo NOT NULL en BBDD locales.
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
        ensureNumericDefaultIfColumnExists("goals");
        ensureNumericDefaultIfColumnExists("objectives");
    }

    private void ensureNumericDefaultIfColumnExists(String tableName) {
        try {
            Integer columnCount = jdbcTemplate.queryForObject(
                    """
                            SELECT COUNT(*)
                            FROM information_schema.columns
                            WHERE table_schema = DATABASE()
                              AND table_name = ?
                              AND column_name = 'is_numeric'
                            """,
                    Integer.class,
                    tableName
            );

            if (columnCount == null || columnCount == 0) {
                return;
            }

            jdbcTemplate.update("UPDATE " + tableName + " SET is_numeric = FALSE WHERE is_numeric IS NULL");
            jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN is_numeric BOOLEAN NOT NULL DEFAULT FALSE");
        } catch (Exception e) {
            LOG.warning("No se pudo ajustar el default de " + tableName + ".is_numeric: " + e.getMessage());
        }
    }
}
