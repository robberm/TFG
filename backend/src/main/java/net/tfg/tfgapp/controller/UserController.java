package net.tfg.tfgapp.controller;


import net.tfg.tfgapp.DTOs.LoginRequest;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.service.ObjService;
import net.tfg.tfgapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/users")
@RestController
public class UserController {

    //** This class will handle SINGUPS/REGISTERS**/

    @Autowired
    private UserService userService;


    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }
    @PostMapping("/register")
    public ResponseEntity<?> registerUser (@RequestBody User newuser){

        User usercreated = userService.save(newuser);
        return new ResponseEntity<>(usercreated, HttpStatus.CREATED);

    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser (@RequestBody LoginRequest newuser){
        boolean authenticated = userService.authenticateUser(newuser);
        if (authenticated){
        return ResponseEntity.ok("Log-in correcto!");
        }else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario o contraseña invalida. Repita de nuevo.");
        }
    }

}
