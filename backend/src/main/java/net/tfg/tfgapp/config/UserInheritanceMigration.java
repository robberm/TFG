package net.tfg.tfgapp.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class UserInheritanceMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public UserInheritanceMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists("users") || !columnExists("users", "role")) {
            return;
        }

        migrateAdminUsers();
        migratePersonalUsers();
    }

    private void migrateAdminUsers() {
        if (!tableExists("admin_users") || !columnExists("users", "role")) {
            return;
        }

        jdbcTemplate.update("""
                INSERT IGNORE INTO admin_users (id)
                SELECT id
                FROM users
                WHERE role = 'ADMIN'
                """);
    }

    private void migratePersonalUsers() {
        if (!tableExists("personal_users") || !columnExists("users", "role")) {
            return;
        }

        if (columnExists("users", "organization_id") && columnExists("users", "created_by_admin_id")) {
            jdbcTemplate.update("""
                    INSERT IGNORE INTO personal_users (id, organization_id, created_by_admin_id)
                    SELECT id, organization_id, created_by_admin_id
                    FROM users
                    WHERE role = 'PERSONAL'
                    """);
            return;
        }

        jdbcTemplate.update("""
                INSERT IGNORE INTO personal_users (id)
                SELECT id
                FROM users
                WHERE role = 'PERSONAL'
                """);
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.tables
                        WHERE table_schema = DATABASE()
                          AND table_name = ?
                        """,
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = ?
                          AND column_name = ?
                        """,
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }
}
