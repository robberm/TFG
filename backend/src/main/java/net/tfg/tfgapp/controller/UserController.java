package net.tfg.tfgapp.controller;


import net.tfg.tfgapp.DTOs.LoginRequest;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.ObjService;
import net.tfg.tfgapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestMapping("/users")
@RestController
public class UserController {

    //** This class will handle SINGUPS/REGISTERS**/

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;


    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }



    @PostMapping("/login")
    public ResponseEntity<?> loginUser (@RequestBody LoginRequest newuser){
        boolean authenticated = userService.authenticateUser(newuser);
        if (authenticated){

            String token = jwtUtil.generateToken(newuser.getUsername());

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("username", newuser.getUsername());
            response.put("message", "Log-in correcto!");
            return ResponseEntity.ok(response);
        }else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario o contraseña invalida. Repita de nuevo.");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser (@RequestBody User newuser){
        if(!userService.checkRegisterParameters(newuser)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Revisa que la contraseña cumpla con las condiciones");
        }else{
            try{

            User user = userService.save(newuser);
            return ResponseEntity.ok(user);
            }catch(Exception e){
                System.out.println("Register error"+e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error al registrar usuario");
            }

        }

    }

}
