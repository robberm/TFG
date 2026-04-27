package net.tfg.tfgapp.service;

import jakarta.annotation.PostConstruct;
import net.tfg.tfgapp.service.interfaces.IStorageService;
import net.tfg.tfgapp.utils.WindowsUtils;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class AppRestrictionService {

    private final IStorageService storageService;

    public AppRestrictionService(IStorageService storageService) {
        this.storageService = storageService;
    }

    @PostConstruct
    public void init() {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(this::checkSystemState, 0, 5, TimeUnit.SECONDS);
    }

    private void checkSystemState() {
        if (shouldEnforceRestrictions()) {
            enforceRestrictions();
        }
    }

    private boolean shouldEnforceRestrictions() {
        return storageService.loadConfig().isFocusModeEnabled();
    }

    private void enforceRestrictions() {
        IStorageService.Config config = storageService.loadConfig();

        WindowsUtils.getRunningProcesses().stream()
                .map(this::normalizeExecutableNameSafely)
                .filter(config.getBlockedApps()::contains)
                .forEach(WindowsUtils::killProcess);
    }

    public void addBlockedApp(String executableName) {
        String cleanExecutableName = normalizeExecutableName(executableName);

        IStorageService.Config config = storageService.loadConfig();

        if (config.getBlockedApps().contains(cleanExecutableName)) {
            throw new IllegalStateException("La aplicación ya está en la lista bloqueada");
        }

        Set<String> updatedBlockedApps = new HashSet<>(config.getBlockedApps());
        updatedBlockedApps.add(cleanExecutableName);

        config.setBlockedApps(updatedBlockedApps);
        storageService.saveConfig(config);
    }

    public void removeBlockedApp(String executableName) {
        String cleanExecutableName = normalizeExecutableName(executableName);

        IStorageService.Config config = storageService.loadConfig();
        Set<String> updatedBlockedApps = new HashSet<>(config.getBlockedApps());

        if (!updatedBlockedApps.remove(cleanExecutableName)) {
            throw new IllegalArgumentException("La aplicación no estaba en la lista");
        }

        config.setBlockedApps(updatedBlockedApps);
        storageService.saveConfig(config);
    }

    public void resetBlockedApps() {
        IStorageService.Config config = storageService.loadConfig();
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

    public Set<String> getBlockedApps() {
        return Collections.unmodifiableSet(storageService.loadConfig().getBlockedApps());
    }

    /**
     * Se mantiene por compatibilidad retroactiva con endpoints existentes.
     */
    public boolean isGameModeActive() {
        return storageService.loadConfig().isFocusModeEnabled();
    }

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

    private String normalizeExecutableNameSafely(String executableName) {
        try {
            return normalizeExecutableName(executableName);
        } catch (Exception ex) {
            return "";
        }
    }
}
