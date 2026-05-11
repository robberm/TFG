package net.tfg.tfgapp.i18n;

import java.util.Map;

public final class TextConstants {

    private TextConstants() {
    }

    public static final Map<String, String> EN = Map.of(
            "auth.login.invalidCredentials", "Invalid username or password.",
            "auth.login.success", "Log-in successful!",
            "auth.register.success", "User registered successfully.",
            "account.password.changed", "Password updated successfully.",
            "account.username.changed", "Username updated successfully.",
            "profile.image.updated", "Profile image updated successfully.",
            "profile.image.deleted", "Profile image removed successfully.",
            "goal.notFound", "Goal not found.",
            "goal.noAccess", "You do not have permission for this goal.",
            "goal.deleted", "Goal deleted successfully.",
            "habit.notFound", "Habit not found.",
            "habit.noAccess", "You do not have permission for this habit.",
            "habit.deleted", "Habit deleted successfully.",
            "event.notFound", "Event not found.",
            "event.noAccess", "You do not have permission for this event.",
            "user.notFound", "User not found.",
            "apps.blocked.added", "Application added successfully.",
            "apps.blocked.removed", "Application removed successfully.",
            "apps.blocked.reset", "Blocked apps configuration reset to default.",
            "organization.created", "Organization created successfully.",
            "errors.validation.invalidData", "Please review the submitted data.",
            "errors.internal", "An internal error occurred.",
            "errors.auth.tokenMissing", "Authentication token missing or invalid format.",
            "errors.auth.tokenInvalid", "Invalid or expired authentication token.",
            "errors.auth.userNotFound", "User associated with token was not found.",
            "errors.auth.tokenRevoked", "Revoked or invalid token.",
            "errors.profile.load", "Unable to load profile.",
            "errors.profile.update", "Unable to update profile image.",
            "errors.profile.delete", "Unable to delete profile image.",
            "errors.username.update", "Unable to update username.",
            "errors.password.update", "Unable to update password.");

    public static final Map<String, String> ES = Map.of(
            "auth.login.invalidCredentials", "Usuario o contraseña inválida.",
            "auth.login.success", "Log-in correcto!",
            "auth.register.success", "Usuario registrado correctamente.",
            "account.password.changed", "Contraseña actualizada correctamente.",
            "account.username.changed", "Username actualizado correctamente.",
            "profile.image.updated", "Imagen de perfil actualizada correctamente.",
            "profile.image.deleted", "Imagen de perfil eliminada correctamente.",
            "goal.notFound", "Objetivo no encontrado.",
            "goal.noAccess", "No tienes permiso para acceder o modificar este objetivo.",
            "goal.deleted", "Objetivo eliminado correctamente.",
            "habit.notFound", "Hábito no encontrado.",
            "habit.noAccess", "No tienes permiso para acceder o modificar este hábito.",
            "habit.deleted", "Hábito eliminado correctamente.",
            "event.notFound", "Evento no encontrado.",
            "event.noAccess", "No tienes permiso para acceder o modificar este evento.",
            "user.notFound", "Usuario no encontrado.",
            "apps.blocked.added", "Aplicación añadida correctamente.",
            "apps.blocked.removed", "Aplicación borrada correctamente.",
            "apps.blocked.reset", "Configuración completamente reseteada a valores por defecto.",
            "organization.created", "Organización creada correctamente.",
            "errors.validation.invalidData", "Revisa los datos enviados.",
            "errors.internal", "Ha ocurrido un error interno.",
            "errors.auth.tokenMissing", "Token de autenticación no proporcionado o formato incorrecto.",
            "errors.auth.tokenInvalid", "Token de autenticación inválido o expirado.",
            "errors.auth.userNotFound", "Usuario asociado al token no encontrado.",
            "errors.auth.tokenRevoked", "Token revocado o no válido.",
            "errors.profile.load", "No se pudo cargar el perfil.",
            "errors.profile.update", "No se pudo actualizar la foto de perfil.",
            "errors.profile.delete", "No se pudo eliminar la foto.",
            "errors.username.update", "No se pudo actualizar el username.",
            "errors.password.update", "No se pudo actualizar la contraseña.");
}
