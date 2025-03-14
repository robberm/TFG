package net.tfg.tfgapp.domains;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

@Entity
@Table(name= "objectives")
public class Objectives {


    public Objectives() {

    }

    public enum Prioridad {
        Alta,
        Media,
        Baja
    }

    //Atributos de un objetivo X
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    /**NOTA: Si se utiliza GenerationType.AUTO, Hibernate "defaulteará" para la estructura de PostgresSQL**/
    @Column(unique = true)
    private String titulo;
    @Column(unique = false)
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(unique = false)
    private Prioridad priority;

    public Objectives(int id, String titulo, String description, Prioridad priority) {
        this.id = id;
        this.titulo = titulo;
        this.description = description;
        this.priority = priority;
    }
}


