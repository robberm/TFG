package net.tfg.tfgapp.service;

import net.tfg.tfgapp.DTOs.LoginRequest;
import net.tfg.tfgapp.domains.Objectives;
import net.tfg.tfgapp.domains.User;
import net.tfg.tfgapp.mappers.LoginMapper;
import net.tfg.tfgapp.repos.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.View;

import java.util.List;
import java.util.logging.Logger;


@Service
public class UserService {

    @Autowired
    private UserRepo uRepo;
    @Autowired
    private LoginMapper userMapper;
    private static final Logger LOG = Logger.getLogger(UserService.class.getName());
    @Autowired
    private View error;


    public <S extends User> S save(S entity) {
       if(checkCredRestrictions(entity)) {return uRepo.save(entity);}
       else {return null;}

    }


    public List<User> findAll() {
        return uRepo.findAll();
    }

    public boolean authenticateUser(LoginRequest newUserL){
     boolean found = false;
     User newUser = userMapper.toUser(newUserL);

        try{
            checkCredRestrictions(newUser);
            //Recorrer lista buscando match
            User userfound = uRepo.findByUsername(newUserL.getUsername());
            if (userfound != null && userfound.getPassword().equals(newUser.getPassword())){
                found = true;
            }

        }catch (Exception e){
            LOG.warning("Error al autenticar usuario");
        }
      return found;

    }
    public boolean checkRegisterParameters(User newUser){

        boolean allGood = true;
        try{
            if (!checkCredRestrictions(newUser) || !isUserUnique(newUser) ){
                allGood = false;
            }

        }catch(Exception e){
            LOG.warning("Usuario repetido");
        }
        return allGood;
    }


    private boolean checkCredRestrictions(User newUser){
        boolean correct = true;
        try{
            if (newUser == null){
                System.out.println("Estoy pasando por null");
                correct = false;
                throw new IllegalArgumentException("El usuario mapeado es null");

            }
            if (!newUser.getPassword().matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{10,}$")) {
                correct = false;
                throw new IllegalArgumentException("La contraseña debe tener al menos 10 caracteres, incluir letras, números y un símbolo.");
            }

        }catch(Exception e){
            System.out.println("falso");
            LOG.warning("Error al validar datos de usuario");
            return false;

        }
        return correct;

    }

    private boolean isUserUnique(User newUser){
        boolean unique = true;
        try{
            User userFound = uRepo.findByUsername(newUser.getUsername());
            if (userFound != null){
                unique = false;
                throw new IllegalArgumentException("El usuario ya existe");
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return unique;
    }

    public User getUserByUsername(String username){
        return uRepo.findByUsername(username);
    }

}
