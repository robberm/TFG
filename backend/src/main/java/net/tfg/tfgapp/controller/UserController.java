package net.tfg.tfgapp.controller;

import net.tfg.tfgapp.DTOs.users.ChangePasswordRequest;
import net.tfg.tfgapp.DTOs.users.ChangeUsernameRequest;
import net.tfg.tfgapp.DTOs.users.LoginRequest;
import net.tfg.tfgapp.DTOs.users.UserProfileResponse;
import net.tfg.tfgapp.domains.PersonalUser;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.exception.ApiException;
import net.tfg.tfgapp.i18n.LanguageResolver;
import net.tfg.tfgapp.security.TokenService;
import net.tfg.tfgapp.service.interfaces.AccountService;
import net.tfg.tfgapp.service.interfaces.IUserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RequestMapping("/users")
@RestController
public class UserController {

    private final IUserService userService;
    private final TokenService tokenService;
    private final AccountService accountService;
    private final LanguageResolver languageResolver;

    public UserController(IUserService userService,
                          TokenService tokenService,
                          AccountService accountService,
                          LanguageResolver languageResolver) {
        this.userService = userService;
        this.tokenService = tokenService;
        this.accountService = accountService;
        this.languageResolver = languageResolver;
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest request,
                                       @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage,
                                       @RequestHeader(value = "X-Client-Platform", required = false) String clientPlatform) {
        boolean authenticated = accountService.authenticate(request);

        if (!authenticated) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    languageResolver.text(acceptLanguage, "auth.login.invalidCredentials")
            );
        }

        User user = userService.getUserByUsername(request.getUsername());
        String token = tokenService.generateToken(user.getUsername(), user.getTokenVersion(), isDesktopClient(clientPlatform));

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole().name());
        response.put("organizationId", organizationId(user));
        response.put("organizationName", organizationName(user));
        response.put("message", languageResolver.text(acceptLanguage, "auth.login.success"));

        return ResponseEntity.ok(response);
    }

    /**
     * Registro público para usuarios personales.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody PersonalUser newUser,
                                          @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage,
                                          @RequestHeader(value = "X-Client-Platform", required = false) String clientPlatform) {
        User user = accountService.register(newUser);

        String token = tokenService.generateToken(user.getUsername(), user.getTokenVersion(), isDesktopClient(clientPlatform));

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole().name());
        response.put("organizationId", null);
        response.put("organizationName", null);
        response.put("message", languageResolver.text(acceptLanguage, "auth.register.success"));

        return ResponseEntity.ok(response);
    }

    @PostMapping("change/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request,
                                            @RequestHeader("Authorization") String authHeader,
                                            @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage,
                                            @RequestHeader(value = "X-Client-Platform", required = false) String clientPlatform) {
        String token = extractAndVerifyToken(authHeader, acceptLanguage);
        String usernameFromToken = tokenService.extractUsername(token);

        User updatedUser = accountService.changePassword(usernameFromToken, request);
        String newToken = tokenService.generateToken(updatedUser.getUsername(), updatedUser.getTokenVersion(), isDesktopClient(clientPlatform));

        Map<String, Object> response = new HashMap<>();
        response.put("message", languageResolver.text(acceptLanguage, "account.password.changed"));
        response.put("token", newToken);
        response.put("username", updatedUser.getUsername());
        response.put("role", updatedUser.getRole().name());
        response.put("organizationId", organizationId(updatedUser));
        response.put("organizationName", organizationName(updatedUser));

        return ResponseEntity.ok(response);
    }

    @PostMapping("change/username")
    public ResponseEntity<?> changeUsername(@RequestBody ChangeUsernameRequest request,
                                            @RequestHeader("Authorization") String authHeader,
                                            @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage,
                                            @RequestHeader(value = "X-Client-Platform", required = false) String clientPlatform) {
        String token = extractAndVerifyToken(authHeader, acceptLanguage);
        String usernameFromToken = tokenService.extractUsername(token);

        User updatedUser = accountService.changeUsername(usernameFromToken, request);
        String newToken = tokenService.generateToken(updatedUser.getUsername(), updatedUser.getTokenVersion(), isDesktopClient(clientPlatform));

        Map<String, Object> response = new HashMap<>();
        response.put("message", languageResolver.text(acceptLanguage, "account.username.changed"));
        response.put("token", newToken);
        response.put("username", updatedUser.getUsername());
        response.put("role", updatedUser.getRole().name());
        response.put("organizationId", organizationId(updatedUser));
        response.put("organizationName", organizationName(updatedUser));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile(@RequestHeader("Authorization") String authHeader) {
        String token = extractAndVerifyToken(authHeader, null);
        String usernameFromToken = tokenService.extractUsername(token);

        UserProfileResponse response = accountService.getProfileData(usernameFromToken);
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProfileImage(@RequestParam("file") MultipartFile file,
                                                @RequestHeader("Authorization") String authHeader,
                                                @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
        String token = extractAndVerifyToken(authHeader, acceptLanguage);
        String usernameFromToken = tokenService.extractUsername(token);

        User updatedUser = accountService.updateProfileImage(usernameFromToken, file);

        Map<String, Object> response = new HashMap<>();
        response.put("message", languageResolver.text(acceptLanguage, "profile.image.updated"));
        response.put("profileImagePath", updatedUser.getProfileImagePath());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/profile-image")
    public ResponseEntity<?> deleteProfileImage(@RequestHeader("Authorization") String authHeader,
                                                @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
        String token = extractAndVerifyToken(authHeader, acceptLanguage);
        String usernameFromToken = tokenService.extractUsername(token);

        accountService.removeProfileImage(usernameFromToken);

        Map<String, Object> response = new HashMap<>();
        response.put("message", languageResolver.text(acceptLanguage, "profile.image.deleted"));
        response.put("profileImagePath", null);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(@RequestHeader("Authorization") String authHeader,
                                               @RequestHeader(value = "Accept-Language", required = false) String acceptLanguage) {
        String token = extractAndVerifyToken(authHeader, acceptLanguage);
        String usernameFromToken = tokenService.extractUsername(token);

        accountService.deleteCurrentUser(usernameFromToken);

        Map<String, Object> response = new HashMap<>();
        response.put("message", languageResolver.text(acceptLanguage, "account.deleted"));
        return ResponseEntity.ok(response);
    }

    private Long organizationId(User user) {
        return user instanceof PersonalUser personalUser && personalUser.getOrganization() != null
                ? personalUser.getOrganization().getId()
                : null;
    }

    private String organizationName(User user) {
        return user instanceof PersonalUser personalUser && personalUser.getOrganization() != null
                ? personalUser.getOrganization().getName()
                : null;
    }

    private boolean isDesktopClient(String clientPlatform) {
        return clientPlatform != null && clientPlatform.equalsIgnoreCase("desktop");
    }

    private String extractAndVerifyToken(String authHeader, String acceptLanguage) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, languageResolver.text(acceptLanguage, "errors.auth.tokenMissing"));
        }

        String token = authHeader.replace("Bearer ", "").trim();

        if (!tokenService.validateToken(token)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, languageResolver.text(acceptLanguage, "errors.auth.tokenInvalid"));
        }

        String username = tokenService.extractUsername(token);
        User user = userService.getUserByUsername(username);

        if (user == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, languageResolver.text(acceptLanguage, "errors.auth.userNotFound"));
        }

        if (!tokenService.validateToken(token, user.getUsername(), user.getTokenVersion())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, languageResolver.text(acceptLanguage, "errors.auth.tokenRevoked"));
        }

        return token;
    }
}
