package net.tfg.tfgapp.i18n;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class LanguageResolver {
    private static final Map<String, String> LEGACY_TEXT_TO_KEY = new HashMap<>();

    static {
        LEGACY_TEXT_TO_KEY.put("Revisa los datos enviados.", "errors.validation.invalidData");
        LEGACY_TEXT_TO_KEY.put("Ha ocurrido un error interno.", "errors.internal");
        LEGACY_TEXT_TO_KEY.put("Token de autenticación no proporcionado o formato incorrecto.", "errors.auth.tokenMissing");
        LEGACY_TEXT_TO_KEY.put("Token de autenticación inválido o expirado.", "errors.auth.tokenInvalid");
        LEGACY_TEXT_TO_KEY.put("Usuario asociado al token no encontrado.", "errors.auth.userNotFound");
        LEGACY_TEXT_TO_KEY.put("Token revocado o no válido.", "errors.auth.tokenRevoked");
        LEGACY_TEXT_TO_KEY.put("Hábito no encontrado.", "habit.notFound");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para acceder o modificar este hábito.", "habit.noAccess");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para acceder a este hábito.", "habit.noAccess");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para actualizar este hábito.", "habit.noAccess");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para eliminar este hábito.", "habit.noAccess");
        LEGACY_TEXT_TO_KEY.put("Hábito eliminado correctamente.", "habit.deleted");
        LEGACY_TEXT_TO_KEY.put("Objetivo no encontrado.", "goal.notFound");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para acceder o modificar este objetivo.", "goal.noAccess");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para actualizar este objetivo.", "goal.noAccess");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para acceder a este objetivo.", "goal.noAccess");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para eliminar este objetivo.", "goal.noAccess");
        LEGACY_TEXT_TO_KEY.put("Objetivo eliminado correctamente.", "goal.deleted");
        LEGACY_TEXT_TO_KEY.put("Evento no encontrado.", "event.notFound");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para acceder o modificar este evento.", "event.noAccess");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para actualizar este evento.", "event.noAccess");
        LEGACY_TEXT_TO_KEY.put("No tienes permiso para eliminar este evento.", "event.noAccess");
        LEGACY_TEXT_TO_KEY.put("Usuario no encontrado.", "user.notFound");
    }

    public String resolveLanguage(String acceptLanguageHeader) {
        if (acceptLanguageHeader == null || acceptLanguageHeader.isBlank()) {
            return "en";
        }

        String normalized = acceptLanguageHeader.toLowerCase();
        return normalized.startsWith("es") ? "es" : "en";
    }

    public String text(String acceptLanguageHeader, String key) {
        String language = resolveLanguage(acceptLanguageHeader);
        Map<String, String> dictionary = "es".equals(language) ? TextConstants.ES : TextConstants.EN;
        return dictionary.getOrDefault(key, TextConstants.EN.getOrDefault(key, key));
    }

    public String textOrLegacy(String acceptLanguageHeader, String messageOrKey) {
        String key = LEGACY_TEXT_TO_KEY.getOrDefault(messageOrKey, messageOrKey);
        return text(acceptLanguageHeader, key);
    }
}
