package net.tfg.tfgapp.security;


import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.boot.autoconfigure.security.oauth2.resource.OAuth2ResourceServerProperties;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;


import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {


    public JwtUtil() {
    }

    /**
     * Clase cuyo propósito es gestionar los tokkens de sesíón.
     */



    @Value("${jwt.secret}")
    private String secret_key;

    @Value("${jwt.expiration}")
    private int EXPIRATION_MS;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret_key.getBytes());
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

     // obtener username a raíz del token
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

     //verifica que el token no es invalido / expirado
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}


