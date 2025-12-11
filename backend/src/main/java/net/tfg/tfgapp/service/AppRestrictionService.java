package net.tfg.tfgapp.service;



import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;

import org.springframework.stereotype.Service;
import net.tfg.tfgapp.utils.WindowsUtils;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
@Getter
@Setter
@Service
public class AppRestrictionService {
    private final StorageService storageService;
    private final WindowsUtils windowsUtils;
    private boolean isGameModeActive = false;

    public AppRestrictionService(StorageService storageService, WindowsUtils windowsUtils) {
        this.storageService = storageService;
        this.windowsUtils = windowsUtils;


    }

    @PostConstruct
    public void init() {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(this::checkSystemState, 0, 5, TimeUnit.SECONDS);
    }

    private void checkSystemState() {
        if(shouldEnforceRestrictions()){
            enforceRestrictions();
        }

    }

    private void checkGameMode() {
        StorageService.Config config = storageService.loadConfig();
        isGameModeActive = windowsUtils.getRunningProcesses().stream()
                .anyMatch(config.getGames()::contains) && windowsUtils.isAppFullscreen();
    }

    private boolean shouldEnforceRestrictions() {
        LocalTime now = LocalTime.now();
        DayOfWeek day = LocalDate.now().getDayOfWeek();

        return !isGameModeActive;
    }

    private void enforceRestrictions() {
        StorageService.Config config = storageService.loadConfig();
        windowsUtils.getRunningProcesses().stream()
                .filter(config.getBlockedApps()::contains)
                .forEach(WindowsUtils::killProcess);
    }

    public void addBlockedApp(String appName) {
        // Validación robusta del nombre de la aplicación
        if (appName == null || appName.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre de la aplicación no puede estar vacío");
        }

        // Limpieza del input
        String cleanAppName = appName.trim().toLowerCase();

        // Validación del formato (solo permite nombres de archivo válidos)
        if (!cleanAppName.matches("^[a-z0-9_.-]+\\.(exe|EXE)$")) {
            throw new IllegalArgumentException("Formato de nombre de aplicación inválido: " + appName);
        }

        // Validación de duplicados
        StorageService.Config config = storageService.loadConfig();
        if (config.getBlockedApps().contains(cleanAppName)) {
            throw new IllegalStateException("La aplicación ya está en la lista bloqueada");
        }

        // Añadir y guardar
        config.getBlockedApps().add(cleanAppName);
        storageService.saveConfig(config);
    }


    public void removeBlockedApp(String appName) {



            if (appName == null || appName.trim().isEmpty()) {
                throw new IllegalArgumentException("El nombre de la aplicación no puede estar vacío");
            }

            String cleanAppName = appName.trim().toLowerCase();

            if (!cleanAppName.matches("^[a-z0-9_.-]+\\.(exe|EXE)$")) {
                throw new IllegalArgumentException("Formato de nombre de aplicación inválido: " + appName);
            }

            StorageService.Config config = storageService.loadConfig();
            if (!config.getBlockedApps().remove(cleanAppName)) {
                throw new IllegalArgumentException("La aplicación no estaba en la lista");
            }

            storageService.saveConfig(config);
    }
    public void resetBlockedApps() {
        StorageService.Config config = new StorageService.Config();
        config.setBlockedApps(new HashSet<>(Set.of("valorant.exe", "leagueoflegends.exe", "riotclientservices.exe", "steam.exe")));
        config.setGames(Set.of("valorant.exe", "leagueoflegends.exe", "riotclientservices.exe", "steam.exe"));
        storageService.saveConfig(config);
    }
    public Set<String> getBlockedApps() {
        return Collections.unmodifiableSet(storageService.loadConfig().getBlockedApps());
    }

    public boolean isGameModeActive() {
        return isGameModeActive;
    }


}