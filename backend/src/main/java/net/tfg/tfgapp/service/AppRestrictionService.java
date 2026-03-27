package net.tfg.tfgapp.service;




import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import net.tfg.tfgapp.utils.WindowsUtils;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class AppRestrictionService {

    private final StorageService storageService;
    private volatile boolean gameModeActive = false;

    public AppRestrictionService(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostConstruct
    public void init() {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(this::checkSystemState, 0, 5, TimeUnit.SECONDS);
    }

    /**
     * Revisa periódicamente el estado del sistema y aplica restricciones si corresponde.
     * Primero recalcula el game mode para que la decisión de bloqueo use un estado actualizado.
     */
    private void checkSystemState() {
        refreshGameModeState();

        if (shouldEnforceRestrictions()) {
            enforceRestrictions();
        }
    }

    /**
     * Recalcula si el game mode está activo.
     * Se considera activo cuando hay un juego configurado ejecutándose
     * y además la aplicación en primer plano está a pantalla completa.
     */
    private void refreshGameModeState() {
        StorageService.Config config = storageService.loadConfig();

        this.gameModeActive = WindowsUtils.getRunningProcesses().stream()
                .anyMatch(process -> config.getGames().contains(process))
                && WindowsUtils.isAppFullscreen();
    }

    /**
     * Determina si deben aplicarse las restricciones de aplicaciones.
     * Ahora mismo la condición principal es que no esté activo el game mode.
     *
     * @return true si procede forzar el cierre de aplicaciones bloqueadas.
     */
    private boolean shouldEnforceRestrictions() {
        return !gameModeActive;
    }

    /**
     * Fuerza el cierre de las aplicaciones que estén configuradas como bloqueadas
     * y actualmente estén en ejecución.
     */
    private void enforceRestrictions() {
        StorageService.Config config = storageService.loadConfig();

        WindowsUtils.getRunningProcesses().stream()
                .filter(config.getBlockedApps()::contains)
                .forEach(WindowsUtils::killProcess);
    }

    /**
     * Añade un ejecutable a la lista de aplicaciones bloqueadas.
     * El sistema bloquea por nombre de proceso y no por nombre bonito de la aplicación.
     *
     * @param executableName nombre del proceso principal, por ejemplo "discord.exe".
     */
    public void addBlockedApp(String executableName) {
        String cleanExecutableName = normalizeExecutableName(executableName);

        StorageService.Config config = storageService.loadConfig();

        if (config.getBlockedApps().contains(cleanExecutableName)) {
            throw new IllegalStateException("La aplicación ya está en la lista bloqueada");
        }

        Set<String> updatedBlockedApps = new HashSet<>(config.getBlockedApps());
        updatedBlockedApps.add(cleanExecutableName);

        config.setBlockedApps(updatedBlockedApps);
        storageService.saveConfig(config);
    }

    /**
     * Elimina un ejecutable de la lista de aplicaciones bloqueadas.
     *
     * @param executableName nombre del proceso principal a eliminar.
     */
    public void removeBlockedApp(String executableName) {
        String cleanExecutableName = normalizeExecutableName(executableName);

        StorageService.Config config = storageService.loadConfig();
        Set<String> updatedBlockedApps = new HashSet<>(config.getBlockedApps());

        if (!updatedBlockedApps.remove(cleanExecutableName)) {
            throw new IllegalArgumentException("La aplicación no estaba en la lista");
        }

        config.setBlockedApps(updatedBlockedApps);
        storageService.saveConfig(config);
    }

    /**
     * Restablece la configuración por defecto de aplicaciones bloqueadas y juegos.
     */
    public void resetBlockedApps() {
        StorageService.Config config = new StorageService.Config();
        config.setBlockedApps(new HashSet<>(Set.of(
                "valorant.exe",
                "leagueoflegends.exe",
                "riotclientservices.exe",
                "steam.exe"
        )));
        config.setGames(Set.of(
                "valorant.exe",
                "leagueoflegends.exe",
                "riotclientservices.exe",
                "steam.exe"
        ));
        storageService.saveConfig(config);
    }

    /**
     * Devuelve la lista actual de ejecutables bloqueados en modo solo lectura.
     *
     * @return conjunto inmodificable de ejecutables bloqueados.
     */
    public Set<String> getBlockedApps() {
        return Collections.unmodifiableSet(storageService.loadConfig().getBlockedApps());
    }

    /**
     * Indica si el sistema considera que el game mode está activo.
     *
     * @return true si hay juego detectado a pantalla completa.
     */

    public boolean isGameModeActive() {
        return gameModeActive;
    }

    /**
     * Normaliza y valida el nombre del ejecutable recibido desde el frontend.
     *
     * @param executableName valor recibido.
     * @return nombre limpio y en minúsculas.
     */
    private String normalizeExecutableName(String executableName) {
        if (executableName == null || executableName.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la aplicación no puede estar vacío");
        }

        String cleanExecutableName = executableName.trim().toLowerCase();

        if (!cleanExecutableName.matches("^[a-z0-9_.-]+\\.exe$")) {
            throw new IllegalArgumentException("Formato de nombre de aplicación inválido: " + executableName);
        }

        return cleanExecutableName;
    }
}