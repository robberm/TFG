package net.tfg.tfgapp.controller;


import net.tfg.tfgapp.domains.Objectives;
import net.tfg.tfgapp.service.ObjService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RequestMapping("/objectives")
@RestController
public class APIrest {

    @Autowired
    private ObjService objService;


    @GetMapping
    private ResponseEntity<?> getAllObjectives() {

        List<Objectives> objectivesList = objService.findAll();
        return ResponseEntity.ok(objectivesList);
    }

//NOTA: .body() sirve para retornar al frontend el objeto; es decir, el body de la operación a retornar
    @PostMapping
    private ResponseEntity<?> postObjective(@RequestBody Objectives objective){
        try{
            Objectives obj = objService.save(objective);
            return ResponseEntity.created(new URI("/objectives/"+obj.getId())).body(obj);
        }catch(Exception e){
            return ResponseEntity.badRequest().body("Hubo un fallo al crear el objetivo"+e.getMessage());
        }

    }



}
