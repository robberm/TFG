package net.tfg.tfgapp.DTOs;


import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {


    /**
     * Realizo esta clase para evitar que se exponga la clase completa. Evitando que posiblemente se manden en los request cosas como passwords.
     * Evitando acomplamiento.
     **/
 @NonNull
    private String username;
 @NonNull
    private String password;

}
