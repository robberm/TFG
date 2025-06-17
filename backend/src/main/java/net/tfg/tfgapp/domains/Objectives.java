package net.tfg.tfgapp.domains;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

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

    public enum Status {
        Done,
        InProgress,
        NotStarted,
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
    @Enumerated(EnumType.STRING)
    @Column(unique = false)
    private Status status;
    @Column(nullable = false)
    @JsonProperty("isNumeric")
    private boolean isNumeric = false;
    @Column(nullable = true)
    private Double valorProgreso;
    @Column(nullable = true)
    private Double valorObjetivo;


    @ManyToOne
    @JoinColumn(name = "user_id") //foreign key para usuarios
    private User user;

    public Objectives(int id, String titulo, String description, Prioridad priority, Status status, boolean isNumeric, double valorProgres, double valorObjetivo ) {
        this.id = id;
        this.titulo = titulo;
        this.description = description;
        this.priority = priority;
        this.status = status;
        if (isNumeric){
            this.valorProgreso = valorProgres;
            this.valorObjetivo = valorObjetivo;
        }
    }
}


