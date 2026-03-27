package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.apprestrict.BlockedApplicationRequest;
import net.tfg.tfgapp.DTOs.apprestrict.InstalledApplicationDTO;
import net.tfg.tfgapp.service.AppRestrictionService;
import net.tfg.tfgapp.service.BlockingService;
import net.tfg.tfgapp.service.InstalledApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class AppController {

    private final AppRestrictionService restrictionService;
    private final BlockingService blockingService;
    private final InstalledApplicationService installedApplicationService;

    public AppController(AppRestrictionService restrictionService,
                         BlockingService blockingService,
                         InstalledApplicationService installedApplicationService) {
        this.restrictionService = restrictionService;
        this.blockingService = blockingService;
        this.installedApplicationService = installedApplicationService;
    }

    /**
     * Devuelve el catálogo de aplicaciones instaladas detectadas en Windows.
     * Cada aplicación incluye su nombre visible y, cuando se ha podido deducir, su ejecutable principal.
     *
     * @return lista de aplicaciones instaladas.
     */
    @GetMapping("/installed-apps")
    public List<InstalledApplicationDTO> getInstalledApplications() {
        return installedApplicationService.getInstalledApplicationsDetailed();
    }

    @GetMapping("/blocked-apps")
    public Set<String> getBlockedApps() {
        return restrictionService.getBlockedApps();
    }

    /**
     * Añade una aplicación a la lista bloqueada usando el ejecutable principal resuelto.
     *
     * @param request cuerpo con el nombre del ejecutable a bloquear.
     * @return mensaje de confirmación o error.
     */
    @PostMapping("/blocked-apps")
    public ResponseEntity<String> addBlockedApp(@RequestBody BlockedApplicationRequest request) {
        try {
            restrictionService.addBlockedApp(request.getExecutableName());
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

    @DeleteMapping("/blocked-apps/reset")
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
