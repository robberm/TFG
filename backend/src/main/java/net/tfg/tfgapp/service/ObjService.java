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
public class ObjService implements  ObjRepo{

    /**Utilizado para mapear correctamente la dependencia**/

    @Autowired
    @Qualifier("objRepo")
    private ObjRepo repo;
    @Autowired
    private ObjRepo objRepo;

    public ObjService() {
        this.repo = repo;
    }

    /** A continuación todas los metodos auto-importados del JPA repository**/
    @Override
    public void flush() {

    }

    @Override
    public <S extends Objectives> S saveAndFlush(S entity) {
        return null;
    }

    @Override
    public <S extends Objectives> List<S> saveAllAndFlush(Iterable<S> entities) {
        return List.of();
    }

    @Override
    public void deleteAllInBatch(Iterable<Objectives> entities) {

    }

    @Override
    public void deleteAllByIdInBatch(Iterable<Long> longs) {

    }

    @Override
    public void deleteAllInBatch() {

    }

    @Override
    public Objectives getOne(Long aLong) {
        return null;
    }

    @Override
    public Objectives getById(Long aLong) {
        return null;
    }

    @Override
    public Objectives getReferenceById(Long aLong) {
        return null;
    }

    @Override
    public <S extends Objectives> Optional<S> findOne(Example<S> example) {
        return Optional.empty();
    }

    @Override
    public <S extends Objectives> List<S> findAll(Example<S> example) {
        return List.of();
    }

    @Override
    public <S extends Objectives> List<S> findAll(Example<S> example, Sort sort) {
        return List.of();
    }

    @Override
    public <S extends Objectives> Page<S> findAll(Example<S> example, Pageable pageable) {
        return null;
    }

    @Override
    public <S extends Objectives> long count(Example<S> example) {
        return 0;
    }

    @Override
    public <S extends Objectives> boolean exists(Example<S> example) {
        return false;
    }

    @Override
    public <S extends Objectives, R> R findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction) {
        return null;
    }

    @Override
    public <S extends Objectives> S save(S entity) {
        return null;
    }

    @Override
    public <S extends Objectives> List<S> saveAll(Iterable<S> entities) {
        return List.of();
    }

    @Override
    public Optional<Objectives> findById(Long aLong) {
        return Optional.empty();
    }

    @Override
    public boolean existsById(Long aLong) {
        return false;
    }

    @Override
    public List<Objectives> findAll() {
        return objRepo.findAll();
    }

    @Override
    public List<Objectives> findAllById(Iterable<Long> longs) {
        return List.of();
    }

    @Override
    public long count() {
        return 0;
    }

    @Override
    public void deleteById(Long aLong) {

    }

    @Override
    public void delete(Objectives entity) {

    }

    @Override
    public void deleteAllById(Iterable<? extends Long> longs) {

    }

    @Override
    public void deleteAll(Iterable<? extends Objectives> entities) {

    }

    @Override
    public void deleteAll() {

    }

    @Override
    public List<Objectives> findAll(Sort sort) {
        return List.of();
    }

    @Override
    public Page<Objectives> findAll(Pageable pageable) {
        return null;
    }
}
