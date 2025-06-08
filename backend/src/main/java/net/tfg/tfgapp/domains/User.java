package net.tfg.tfgapp.domains;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


import java.util.ArrayList;
import java.util.List;

@Getter
@Setter

@Entity
@Table(name= "Users")
public class User {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }
    @JsonIgnore  // Esto evita la serialización del campo `objetivos` en la respuesta
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)// No necesido Cascade.ALL ya que solo me interesa en caso del borrado de un User.
    private List<Objectives> objetivos = new ArrayList<>();


    public User() {}


}
