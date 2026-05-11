package net.tfg.tfgapp.controller.objectives;

import net.tfg.tfgapp.DTOs.objectives.HabitCompletionRequest;
import net.tfg.tfgapp.DTOs.objectives.HabitRequest;
import net.tfg.tfgapp.domains.Habit;
import net.tfg.tfgapp.domains.ObjectiveLog;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.exception.ApiException;
import net.tfg.tfgapp.i18n.LanguageResolver;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.interfaces.IHabitService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/habits")
public class HabitController {

    private final IHabitService habitService;
    private final JwtUtil jwtUtil;
    private final IUserService userService;
    private final LanguageResolver languageResolver;

    public HabitController(IHabitService habitService, JwtUtil jwtUtil, IUserService userService, LanguageResolver languageResolver) {
        this.habitService = habitService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.languageResolver = languageResolver;
    }

    @GetMapping
    public ResponseEntity<?> getMyHabits(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        return ResponseEntity.ok(habitService.getByUsername(username));
    }

    @GetMapping("/active")
    public ResponseEntity<?> getMyActiveHabits(@RequestHeader("Authorization") String token) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        return ResponseEntity.ok(habitService.getActiveHabitsByUsername(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHabitById(@RequestHeader("Authorization") String token,
                                          @RequestHeader(value = "Accept-Language", required = false) String language,
                                          @PathVariable Integer id) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Habit habit = habitService.findById(id);

        if (habit == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, languageResolver.text(language, "habit.notFound"));
        }

        if (!habit.getUser().getUsername().equals(username)) {
            throw new SecurityException(languageResolver.text(language, "habit.noAccess"));
        }

        return ResponseEntity.ok(habit);
    }

    @PostMapping
    public ResponseEntity<?> createHabit(@RequestHeader("Authorization") String token,
                                         @RequestHeader(value = "Accept-Language", required = false) String language,
                                         @RequestBody HabitRequest request) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        User user = userService.getUserByUsername(username);

        if (user == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, languageResolver.text(language, "user.notFound"));
        }

        Habit createdHabit = habitService.createHabit(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdHabit);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHabit(@RequestHeader("Authorization") String token,
                                         @RequestHeader(value = "Accept-Language", required = false) String language,
                                         @PathVariable Integer id,
                                         @RequestBody HabitRequest request) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Habit existingHabit = habitService.findById(id);

        if (existingHabit == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, languageResolver.text(language, "habit.notFound"));
        }

        if (!existingHabit.getUser().getUsername().equals(username)) {
            throw new SecurityException(languageResolver.text(language, "habit.noAccess"));
        }

        return ResponseEntity.ok(habitService.updateHabit(existingHabit, request));
    }

    @PatchMapping("/{id}/completion")
    public ResponseEntity<?> markHabitCompletion(@RequestHeader("Authorization") String token,
                                                 @RequestHeader(value = "Accept-Language", required = false) String language,
                                                 @PathVariable Integer id,
                                                 @RequestBody HabitCompletionRequest request) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Habit habit = habitService.findById(id);

        if (habit == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, languageResolver.text(language, "habit.notFound"));
        }

        if (!habit.getUser().getUsername().equals(username)) {
            throw new SecurityException(languageResolver.text(language, "habit.noAccess"));
        }

        ObjectiveLog log = habitService.markHabitCompletion(habit, request);
        return ResponseEntity.ok(log);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHabit(@RequestHeader("Authorization") String token,
                                         @RequestHeader(value = "Accept-Language", required = false) String language,
                                         @PathVariable Integer id) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Habit habit = habitService.findById(id);

        if (habit == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, languageResolver.text(language, "habit.notFound"));
        }

        if (!habit.getUser().getUsername().equals(username)) {
            throw new SecurityException(languageResolver.text(language, "habit.noAccess"));
        }

        habitService.deleteById(id);
        return ResponseEntity.ok(languageResolver.text(language, "habit.deleted"));
    }
}
