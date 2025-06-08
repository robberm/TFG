package net.tfg.tfgapp.controller;


import net.tfg.tfgapp.domains.Objectives;
import net.tfg.tfgapp.security.JwtUtil;
import net.tfg.tfgapp.service.ObjService;
import net.tfg.tfgapp.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RequestMapping("/objectives")
@RestController
public class ObjectiveController {

    @Autowired
    private ObjService objService;

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserService userService;

    @GetMapping("/{username}")
    private ResponseEntity<?> getAllObjectives(@PathVariable String username) {

        List<Objectives> objectivesList = objService.getObjectivesByUsername(username);
        return ResponseEntity.ok(objectivesList);
    }

//NOTA: .body() sirve para retornar al frontend el objeto; es decir, el body de la operación a retornar
    @PostMapping
    private ResponseEntity<?> postObjective(@RequestBody Objectives objective, @RequestHeader("Authorization") String token){
        try{

            String tokenF = token.replace("Bearer ", "").trim();
            String username = jwtUtil.extractUsername(tokenF);
            System.out.println(username);
            if (userService.getUserByUsername(username) == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Usuario no encontrado.");
            }
            objective.setUser(userService.getUserByUsername(username));

            Objectives obj = objService.save(objective);
            return ResponseEntity.created(new URI("/objectives/"+obj.getId())).body(obj);
        }catch(Exception e){
            return ResponseEntity.badRequest().body("Hubo un fallo al crear el objetivo"+e.getMessage());
        }

    }



}
