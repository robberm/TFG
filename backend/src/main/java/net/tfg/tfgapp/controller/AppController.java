package net.tfg.tfgapp.controller;


import net.tfg.tfgapp.service.AppRestrictionService;
import net.tfg.tfgapp.service.BlockingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api")
public class AppController {

    private final AppRestrictionService restrictionService;
    private final BlockingService blockingService;

    public AppController(AppRestrictionService restrictionService,
                         BlockingService blockingService) {
        this.restrictionService = restrictionService;
        this.blockingService = blockingService;
    }

    @GetMapping("/blocked-apps")
    public Set<String> getBlockedApps() {
        return restrictionService.getBlockedApps();
    }

    @PostMapping("/blocked-apps")
    public ResponseEntity<String> addBlockedApp(@RequestBody String appName) {
        try {
            restrictionService.addBlockedApp(appName);
            return ResponseEntity.ok("Aplicación añadida correctamente");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @DeleteMapping("/blocked-apps/{appName}")
    public ResponseEntity<String> removeBlockedApp(@PathVariable String appName) {

        try {
         restrictionService.removeBlockedApp(appName);
         return ResponseEntity.ok("Aplicación borrada correctamente");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }

    }

    @GetMapping("/game-mode")
    public boolean isGameModeActive() {
        return restrictionService.isGameModeActive();
    }

    @GetMapping("/block-status")
    public boolean isBlockingActive() {

        return blockingService.isBlockingActive();


    }

    @DeleteMapping("blocked-apps/reset")
    public ResponseEntity<String> resetBlockedApps() {
        try {
            restrictionService.resetBlockedApps();
            return ResponseEntity.ok("Configuración completamente reseteada a valores por defecto");
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al resetear: " + e.getMessage());
        }
    }
}

