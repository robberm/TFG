package net.tfg.tfgapp.service;

import net.tfg.tfgapp.DTOs.ChangePasswordRequest;
import net.tfg.tfgapp.DTOs.ChangeUsernameRequest;
import net.tfg.tfgapp.DTOs.LoginRequest;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.validation.PasswordPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AccServiceImplements implements AccountService {

    @Autowired
    private final UserService userService;

    @Autowired
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private final PasswordPolicy passwordPolicy;

    public AccServiceImplements(UserService userService, PasswordEncoder passwordEncoder, PasswordPolicy passwordPolicy) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicy = passwordPolicy;
    }

    @Override
    public boolean authenticate(LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            return false;
        }

        User user = userService.getUserByUsername(loginRequest.getUsername());
        if (user == null) return false;

        return passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());
    }

    @Override
    public User register(User newUser) {
        if (newUser == null || newUser.getUsername() == null || newUser.getPassword() == null) {
            throw new IllegalArgumentException("Request inválida.");
        }

        if (userService.existsByUsername(newUser.getUsername())) {
            throw new IllegalArgumentException("El usuario ya existe");
        }

        passwordPolicy.validateOrThrow(newUser.getPassword());
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        newUser.setTokenVersion(0);

        return userService.save(newUser);
    }

    @Override
    public User changePassword(String tokenUsername, ChangePasswordRequest request) {
        if (tokenUsername == null) {
            throw new IllegalArgumentException("Token inválido.");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request inválida.");
        }

        User user = userService.getUserByUsername(tokenUsername);
        if (user == null) {
            throw new IllegalArgumentException("Usuario no encontrado.");
        }

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new IllegalArgumentException("Debes introducir tu contraseña actual.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("Debes introducir la nueva contraseña.");
        }

        if (request.getConfirmPassword() == null || request.getConfirmPassword().isBlank()) {
            throw new IllegalArgumentException("Debes confirmar la nueva contraseña.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Las contraseñas no coinciden.");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new SecurityException("Contraseña incorrecta.");
        }

        passwordPolicy.validateOrThrow(request.getNewPassword());

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("No puedes introducir la última contraseña.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);

        return userService.save(user);
    }

    @Override
    public User changeUsername(String tokenUsername, ChangeUsernameRequest request) {
        if (tokenUsername == null) {
            throw new IllegalArgumentException("Token inválido.");
        }
        if (request == null) {
            throw new IllegalArgumentException("Request inválida.");
        }

        User user = userService.getUserByUsername(tokenUsername);
        if (user == null) {
            throw new IllegalArgumentException("Usuario no encontrado.");
        }

        if (request.getNewUsername() == null || request.getNewUsername().isBlank()) {
            throw new IllegalArgumentException("El nuevo username no puede estar vacío.");
        }

        if (user.getUsername().equals(request.getNewUsername())) {
            throw new IllegalArgumentException("No puedes introducir el mismo username.");
        }

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new IllegalArgumentException("Debes introducir tu contraseña para cambiar el username.");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new SecurityException("Contraseña incorrecta.");
        }

        if (userService.existsByUsername(request.getNewUsername())) {
            throw new IllegalArgumentException("El username ya existe.");
        }

        user.setUsername(request.getNewUsername());
        user.setTokenVersion(user.getTokenVersion() + 1);

        return userService.save(user);
    }
}