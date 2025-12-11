package net.tfg.tfgapp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Service
public class StorageService {
    private static final ObjectMapper mapper = new ObjectMapper();
    private String storageFile = "./productivity_config.json";

    public Config loadConfig() {
        try {
            File file = new File(storageFile);
            if (!file.exists()) {
                // Configuración por defecto
                Config defaultConfig = new Config();
                defaultConfig.setBlockedApps(new HashSet<>(Set.of("valorant.exe", "leagueoflegends.exe", "riotclientservices.exe", "steam.exe")));
                defaultConfig.setGames(Set.of("valorant.exe", "leagueoflegends.exe", "riotclientservices.exe", "steam.exe"));
                return defaultConfig;
            }
            return mapper.readValue(file, Config.class);
        } catch (IOException e) {
            throw new RuntimeException("Error loading config", e);
        }
    }

    public void saveConfig(Config config) {
        try {
            mapper.writeValue(new File(storageFile), config);
        } catch (IOException e) {
            throw new RuntimeException("Error saving config", e);
        }
    }
    public void cleanAndResetConfig() {
        try {
            Config cleanConfig = new Config();
            cleanConfig.setBlockedApps(new HashSet<>());
            cleanConfig.setGames(Set.of("valorant.exe", "leagueoflegends.exe", "riotclientservices.exe", "steam.exe"));
            mapper.writeValue(new File(storageFile), cleanConfig);
        } catch (IOException e) {
            throw new RuntimeException("Error resetting config", e);
        }
    }
    public static class Config {
        private Set<String> blockedApps;
        private Set<String> games;

        // Getters y setters
        public Set<String> getBlockedApps() {
            return blockedApps != null ? blockedApps : Collections.emptySet();
        }

        public void setBlockedApps(Set<String> blockedApps) {
            this.blockedApps = blockedApps;
        }

        public Set<String> getGames() {
            return games != null ? games : Collections.emptySet();
        }

        public void setGames(Set<String> games) {
            this.games = games;
        }
    }
}
