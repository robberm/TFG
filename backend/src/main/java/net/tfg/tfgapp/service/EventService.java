package net.tfg.tfgapp.service;


import jakarta.persistence.EntityNotFoundException;
import net.tfg.tfgapp.domains.Event;
import net.tfg.tfgapp.repos.EventRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    @Autowired
    public EventRepo eventRepo;

    public <S extends Event> S save(S entity) {
        return eventRepo.save(entity);
    }

    public List<Event> findEventsByUserAndDateRange(String username, LocalDateTime start, LocalDateTime end) {
        return eventRepo.findEventsByUserAndDateRange(username, start, end);
    }


    public List<Event> getEventsByUsername(String username ){
        return eventRepo.findEventsByUser(username);
    }

    public Optional<Event> updateEventById(Long id, Event eventDetails) {
        Optional<Event> eventOptional = getEventById(id);

        if (eventOptional.isPresent()) { //no puedo != null.
            Event existingEvent = eventOptional.get();
            existingEvent.setTitle(eventDetails.getTitle());
            existingEvent.setDescription(eventDetails.getDescription());
            existingEvent.setStartTime(eventDetails.getStartTime());
            existingEvent.setEndTime(eventDetails.getEndTime());
            existingEvent.setLocation(eventDetails.getLocation());
            existingEvent.setCategory(eventDetails.getCategory());
            existingEvent.setIsAllDay(eventDetails.getIsAllDay());

            Event updatedEvent = eventRepo.save(existingEvent);
            return Optional.of(updatedEvent);
        }

        return Optional.empty();
    }


   /** Aquí si tengo que utilizar Optional ya que JPA lo implementa así **/
    public Optional<Event> getEventById(Long id) {
        return eventRepo.findById(id);
    }

    public void deleteEventById(Long id) {
        if (!eventRepo.existsById(id)) {
            throw new EntityNotFoundException("Event with ID " + id + " not found.");
        }

        eventRepo.deleteById(id);
    }

    public List<Event> findAll() {
        return eventRepo.findAll();
    }


}
