package net.tfg.tfgapp.controller;


import net.tfg.tfgapp.domains.Objectives;
import net.tfg.tfgapp.service.ObjService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/objectives")
@RestController
public class APIrest {

    private ObjService objService;


    @GetMapping
    private ResponseEntity<?> getAllObjectives() {

        List<Objectives> objectivesList = objService.findAll();
        return ResponseEntity.ok(objectivesList);
    }


}
