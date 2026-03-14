package net.tfg.tfgapp.security;

public interface TokenService {

    String generateToken(String username, Integer tokenVersion);

    String extractUsername(String token);

    Integer extractTokenVersion(String token);

    boolean validateToken(String token);

    boolean validateToken(String token, String expectedUsername, Integer expectedTokenVersion);
}