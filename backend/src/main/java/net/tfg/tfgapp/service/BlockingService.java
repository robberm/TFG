package net.tfg.tfgapp.service;


import jakarta.annotation.PostConstruct;
import net.tfg.tfgapp.events.BlockingEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

    @Service
    public class BlockingService {
        private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
        private boolean isBlocking = false;
        private boolean pauseScheduledBlocks = false;
        private long lastBlockTime = 0;

        @Autowired
        private SimpMessageSendingOperations messagingTemplate; //para el blocking entre front - back
        public BlockingService(SimpMessagingTemplate messagingTemplate) {
            this.messagingTemplate = messagingTemplate;
        }
        @Autowired
        private AppRestrictionService restrictionService;

        @Autowired
        private ApplicationEventPublisher eventPublisher;

        @PostConstruct
        public void init() {
            // Programar bloqueos cada 20 minutos
            scheduler.scheduleAtFixedRate(this::checkForBlock, 0, 20, TimeUnit.MINUTES);

            /* Verificar cada minuto si estamos en horario de trabajo
            scheduler.scheduleAtFixedRate(this::checkWorkingHours, 0, 1, TimeUnit.MINUTES);*/
        }

        private void checkForBlock() {
            if (shouldBlock()) {
                startBlocking();
            }
        }

        private boolean shouldBlock() {
            // No bloquear si:
            // 1. Ya estamos en un bloqueo
            // 3. Está pausado manualmente
            // 4. No es horario laboral
            //la idea es insertar aqui los checks de si lo he deshabilitado manualmente o estoy en partida larga de algun juego
            return !isBlocking &&
                    !pauseScheduledBlocks && !restrictionService.isGameModeActive();

        }

        private boolean isWorkingTime() {
            LocalTime now = LocalTime.now();
            return now.isAfter(LocalTime.of(8, 0)) && now.isBefore(LocalTime.of(18, 0));
        }

        public void startBlocking() {
            isBlocking = true;
            lastBlockTime = System.currentTimeMillis();

            // Enviar evento al frontend para bloquear
            eventPublisher.publishEvent(new BlockingEvent(true));

            // Registrar en consola
            System.out.println("Iniciando bloqueo de pantalla...");
            messagingTemplate.convertAndSend("/topic/block", "BLOCK_SCREEN");
            // Programar fin del bloqueo
            scheduler.schedule(() -> {
                isBlocking = false;
                endBlocking();
            }, 20, TimeUnit.SECONDS);
        }

        private void endBlocking() {
            // Enviar evento al frontend para desbloquear
            eventPublisher.publishEvent(new BlockingEvent(false));
            System.out.println("Bloqueo de pantalla finalizado.");
        }

        public void pauseScheduledBlocks(boolean pause) {
            this.pauseScheduledBlocks = pause;
        }

        public boolean isBlockingActive() {
            return isBlocking;
        }

        public boolean isPaused() {
            return pauseScheduledBlocks;
        }

        // Método para forzar un bloqueo manualmente
        public void forceBlockNow(int durationSeconds) {
            if (!isBlocking) {
                scheduler.execute(() -> {
                    startBlocking();
                    try {
                        TimeUnit.SECONDS.sleep(durationSeconds);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    endBlocking();
                });
            }
        }

        // Método para cancelar un bloqueo en curso
        public void cancelCurrentBlock() {
            if (isBlocking) {
                scheduler.execute(this::endBlocking);
                isBlocking = false;
            }
        }

        // Método para verificar si hay un juego en ejecución
        private void checkWorkingHours() {
            // Opcional: Ajustar comportamiento según horario laboral
        }
    }

