package net.tfg.tfgapp.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import net.tfg.tfgapp.enumerates.UserRole;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @JsonIgnore
    @Column(nullable = false)
    private Integer tokenVersion = 0;

    @Column(nullable = true)
    private String profileImagePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.PERSONAL;

    /**
     * Un usuario personal puede no pertenecer a ninguna organización.
     * Los usuarios creados por un admin sí quedan asociados a la suya.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    /**
     * Referencia al admin que ha dado de alta a este usuario.
     * Para usuarios personales registrados por su cuenta será null.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_admin_id")
    private User createdByAdmin;

    @JsonIgnore
    @OneToMany(mappedBy = "createdByAdmin")
    private List<User> managedUsers = new ArrayList<>();

    @JsonIgnore
    @OneToOne(mappedBy = "admin")
    private Organization administeredOrganization;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Objective> objetivos = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Event> events = new ArrayList<>();

    public User() {
        this.tokenVersion = 0;
        this.role = UserRole.PERSONAL;
    }

    public User(String username, String password) {
        this.username = username;
        this.password = password;
        this.tokenVersion = 0;
        this.role = UserRole.PERSONAL;
    }
}