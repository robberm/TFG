package net.tfg.tfgapp.domains;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.CascadeType;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import net.tfg.tfgapp.enumerates.UserRole;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "personal_users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "organization", "createdByAdmin"})
public class PersonalUser extends User {

    /**
     * Un usuario personal puede no pertenecer a ninguna organización.
     * Los usuarios creados por un admin sí quedan asociados a la suya.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Organization organization;

    /**
     * Referencia al admin que ha dado de alta a este usuario.
     * Para usuarios personales registrados por su cuenta será null.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_admin_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private AdminUser createdByAdmin;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Objective> objetivos = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Event> events = new ArrayList<>();

    public PersonalUser() {
        super();
    }

    public PersonalUser(String username, String password) {
        super(username, password);
    }

    @Override
    public UserRole getRole() {
        return UserRole.PERSONAL;
    }
}
