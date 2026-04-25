package net.tfg.tfgapp.controller.objectives;

import net.tfg.tfgapp.domains.ObjectiveLog;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.interfaces.IObjectiveLogService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/objective-logs")
public class ObjectiveLogController {

    private final IObjectiveLogService objectiveLogService;
    private final JwtUtil jwtUtil;

    public ObjectiveLogController(IObjectiveLogService objectiveLogService, JwtUtil jwtUtil) {
        this.objectiveLogService = objectiveLogService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/objective/{objectiveId}")
    public ResponseEntity<?> getLogsByObjective(@RequestHeader("Authorization") String token,
                                                @PathVariable Integer objectiveId) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        List<ObjectiveLog> logs = objectiveLogService.getObjectiveLogs(objectiveId);

        if (logs.isEmpty()) {
            return ResponseEntity.ok(logs);
        }

        if (!logs.get(0).getObjective().getUser().getUsername().equals(username)) {
            throw new SecurityException("No tienes permiso para acceder a este histórico.");
        }

        return ResponseEntity.ok(logs);
    }

    @GetMapping("/range")
    public ResponseEntity<?> getLogsByRange(@RequestHeader("Authorization") String token,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        return ResponseEntity.ok(objectiveLogService.getUserLogsBetweenDates(username, startDate, endDate));
    }
}
