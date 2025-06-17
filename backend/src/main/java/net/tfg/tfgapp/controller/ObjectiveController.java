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
import java.util.Map;

@RequestMapping("/objectives")
@RestController
public class ObjectiveController {

    @Autowired
    private ObjService objService;

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserService userService;

    @GetMapping("/{username:^(?!\\d+$)[a-zA-Z0-9_-]+$}") //Expresión regular que permite cualquier cosa excepto solo números.
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


    @PutMapping("/{id}/status")
    public ResponseEntity<Objectives> updateObjectiveStatus(@PathVariable int id, @RequestBody Map<String, String> objRequest) {
        Objectives objective = objService.findById(id);

        if (objective == null) {
            return ResponseEntity.notFound().build();
        }
        String newStatus = objRequest.get("status");
        try {
            Objectives.Status statusEnum = Objectives.Status.valueOf(newStatus);
            objective.setStatus(statusEnum);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build(); // o con mensaje personalizado
        }
        objService.save(objective);

        return ResponseEntity.ok(objective);
    }


    @GetMapping("/{id:\\d+}") // Expresión regular para determinar cuando es un id y cuando es un usuario
    public ResponseEntity<?> getObjective(@RequestHeader("Authorization") String token, @PathVariable int id) {

        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Objectives objective = objService.findById(id);


        if (objective == null) {
            return ResponseEntity.notFound().build();
        }

        if (!objective.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tienes permiso para acceder a este objetivo.");
        }

        return ResponseEntity.ok(objective);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Objectives> updateObjective(@RequestHeader("Authorization") String token, @PathVariable int id, @RequestBody Map<String, String> objectiveRequest ) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Objectives existingObjective = objService.findById(id);

        if (existingObjective == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existingObjective.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Actualizamos los campos desde el Map
        existingObjective.setTitulo(objectiveRequest.get("titulo"));
        existingObjective.setDescription(objectiveRequest.get("description"));
        existingObjective.setPriority(Objectives.Prioridad.valueOf(objectiveRequest.get("priority")));
        existingObjective.setStatus(Objectives.Status.valueOf(objectiveRequest.get("status")));

        if (Boolean.parseBoolean(objectiveRequest.get("isNumeric"))) {
            existingObjective.setNumeric(true);
            existingObjective.setValorObjetivo(Double.parseDouble(objectiveRequest.get("valorObjetivo")));
            existingObjective.setValorProgreso(Double.parseDouble(objectiveRequest.get("valorProgreso")));
        } else {
            existingObjective.setNumeric(false);
            existingObjective.setValorObjetivo(null);
            existingObjective.setValorProgreso(null);
        }

        Objectives updated = objService.save(existingObjective);
        return ResponseEntity.ok(updated);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteObjective(@RequestHeader("Authorization") String token, @PathVariable int id) {
        String username = jwtUtil.extractUsername(token.replace("Bearer ", "").trim());
        Objectives existingObjective = objService.findById(id);

        if (existingObjective == null) {
            return ResponseEntity.notFound().build();
        }

        if (!existingObjective.getUser().getUsername().equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        objService.deleteObjective(id);

        return ResponseEntity.ok("Objetivo eliminado correctamente.");

    }



}
