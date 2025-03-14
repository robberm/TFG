package net.tfg.tfgapp.service;

import net.tfg.tfgapp.domains.Objectives;
import net.tfg.tfgapp.repos.ObjRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;


@Service
public class ObjService {

    /**Utilizado para mapear correctamente la dependencia**/

    @Autowired
    private ObjRepo objRepo;



    public <S extends Objectives> S save(S entity) {
        return objRepo.save(entity);
    }


    public List<Objectives> findAll() {
        return objRepo.findAll();
    }

}
