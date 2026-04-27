package net.tfg.tfgapp.service;

import jakarta.annotation.PostConstruct;
import net.tfg.tfgapp.events.BlockingEvent;
import net.tfg.tfgapp.service.interfaces.IStorageService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class BlockingService {
    private static final int DEFAULT_WORK_DURATION_SECONDS = 20 * 60;
    private static final int DEFAULT_BREAK_DURATION_SECONDS = 20;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final SimpMessageSendingOperations messagingTemplate;
    private final ApplicationEventPublisher eventPublisher;
    private final IStorageService storageService;

    private volatile boolean isBlocking = false;
    private volatile boolean pauseScheduledBlocks = false;
    private volatile long lastBlockTime = 0;
    private volatile long nextActionAtEpochMs = 0;

    public BlockingService(SimpMessageSendingOperations messagingTemplate,
                           ApplicationEventPublisher eventPublisher,
                           IStorageService storageService) {
        this.messagingTemplate = messagingTemplate;
        this.eventPublisher = eventPublisher;
        this.storageService = storageService;
    }

    @PostConstruct
    public void init() {
        IStorageService.Config config = storageService.loadConfig();
        if (config.isFocusModeEnabled()) {
            nextActionAtEpochMs = System.currentTimeMillis() + toMillis(getWorkDurationSeconds(config));
        }

        scheduler.scheduleAtFixedRate(this::checkForBlock, 0, 1, TimeUnit.SECONDS);
    }

    private void checkForBlock() {
        if (!shouldBlock()) {
            return;
        }

        if (System.currentTimeMillis() >= nextActionAtEpochMs) {
            executeFocusAction();
        }
    }

    private boolean shouldBlock() {
        IStorageService.Config config = storageService.loadConfig();

        return !isBlocking
                && !pauseScheduledBlocks
                && config.isFocusModeEnabled();
    }

    private void executeFocusAction() {
        IStorageService.Config config = storageService.loadConfig();
        FocusAction action = FocusAction.from(config.getFocusAction());

        if (action == FocusAction.SCREEN_BLOCK) {
            startBlocking(getBreakDurationSeconds(config));
        } else {
            notifyFocusBreak(getBreakDurationSeconds(config));
        }

        this.nextActionAtEpochMs = System.currentTimeMillis() + toMillis(getWorkDurationSeconds(config));
        publishFocusState();
    }

    public void startBlocking(int durationSeconds) {
        isBlocking = true;
        lastBlockTime = System.currentTimeMillis();

        eventPublisher.publishEvent(new BlockingEvent(true));
        messagingTemplate.convertAndSend("/topic/block", "BLOCK_SCREEN");

        scheduler.schedule(() -> {
            isBlocking = false;
            endBlocking();
        }, durationSeconds, TimeUnit.SECONDS);

        publishFocusState();
    }

    private void notifyFocusBreak(int breakDurationSeconds) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "FOCUS_NOTIFICATION");
        payload.put("title", "Tiempo de descanso");
        payload.put("message", "Descansa " + breakDurationSeconds + "s y vuelve al foco.");
        payload.put("breakDurationSeconds", breakDurationSeconds);

        messagingTemplate.convertAndSend("/topic/focus-events", payload);
    }

    private void endBlocking() {
        eventPublisher.publishEvent(new BlockingEvent(false));
        publishFocusState();
    }

    public void pauseScheduledBlocks(boolean pause) {
        this.pauseScheduledBlocks = pause;
        publishFocusState();
    }

    public boolean isBlockingActive() {
        return isBlocking;
    }

    public boolean isPaused() {
        return pauseScheduledBlocks;
    }

    public void forceBlockNow(int durationSeconds) {
        if (!isBlocking) {
            startBlocking(Math.max(1, durationSeconds));
        }
    }

    public void cancelCurrentBlock() {
        if (isBlocking) {
            isBlocking = false;
            endBlocking();
        }
    }

    public Map<String, Object> getFocusState() {
        IStorageService.Config config = storageService.loadConfig();

        Map<String, Object> state = new HashMap<>();
        state.put("focusModeEnabled", config.isFocusModeEnabled());
        state.put("isBlocking", isBlocking);
        state.put("isPaused", pauseScheduledBlocks);
        state.put("workDurationSeconds", getWorkDurationSeconds(config));
        state.put("breakDurationSeconds", getBreakDurationSeconds(config));
        state.put("focusAction", FocusAction.from(config.getFocusAction()).name());
        state.put("nextActionAtEpochMs", nextActionAtEpochMs);
        state.put("serverTimeEpochMs", Instant.now().toEpochMilli());
        state.put("lastBlockTime", lastBlockTime);

        return state;
    }

    public void updateFocusSettings(boolean focusModeEnabled,
                                    Integer workDurationSeconds,
                                    Integer breakDurationSeconds,
                                    String action) {
        IStorageService.Config config = storageService.loadConfig();

        config.setFocusModeEnabled(focusModeEnabled);
        config.setWorkDurationSeconds(sanitizeDuration(workDurationSeconds, DEFAULT_WORK_DURATION_SECONDS));
        config.setBreakDurationSeconds(sanitizeDuration(breakDurationSeconds, DEFAULT_BREAK_DURATION_SECONDS));
        config.setFocusAction(FocusAction.from(action).name());

        storageService.saveConfig(config);

        if (focusModeEnabled) {
            this.nextActionAtEpochMs = System.currentTimeMillis() + toMillis(getWorkDurationSeconds(config));
        } else {
            this.nextActionAtEpochMs = 0;
            cancelCurrentBlock();
        }

        publishFocusState();
    }

    private void publishFocusState() {
        messagingTemplate.convertAndSend("/topic/focus-state", getFocusState());
    }

    private int sanitizeDuration(Integer duration, int defaultValue) {
        if (duration == null || duration <= 0) {
            return defaultValue;
        }

        return duration;
    }

    private int getWorkDurationSeconds(IStorageService.Config config) {
        return sanitizeDuration(config.getWorkDurationSeconds(), DEFAULT_WORK_DURATION_SECONDS);
    }

    private int getBreakDurationSeconds(IStorageService.Config config) {
        return sanitizeDuration(config.getBreakDurationSeconds(), DEFAULT_BREAK_DURATION_SECONDS);
    }

    private long toMillis(int seconds) {
        return seconds * 1000L;
    }

    private enum FocusAction {
        SCREEN_BLOCK,
        NOTIFICATION;

        static FocusAction from(String value) {
            if (value == null) {
                return NOTIFICATION;
            }

            try {
                return FocusAction.valueOf(value.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                return NOTIFICATION;
            }
        }
    }
}
