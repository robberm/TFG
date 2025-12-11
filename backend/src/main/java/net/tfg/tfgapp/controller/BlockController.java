package net.tfg.tfgapp.controller;


import lombok.Getter;
import lombok.Setter;
import net.tfg.tfgapp.service.BlockingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;



@RestController
@RequestMapping("/api/block")
public class BlockController {

    private final BlockingService blockingService;

    @Autowired
    public BlockController(BlockingService blockingService) {
        this.blockingService = blockingService;
    }

    @GetMapping("/status")
    public Map<String, Boolean> getBlockStatus() {
        return Map.of(
                "isBlocking", blockingService.isBlockingActive(),
                "isPaused", blockingService.isPaused()
        );
    }

    @PostMapping("/pause")
    public void pauseBlocking(@RequestParam boolean pause) {
        blockingService.pauseScheduledBlocks(pause);
    }

    @PostMapping("/force")
    public void forceBlock(@RequestParam(required = false, defaultValue = "20") int duration) {
        blockingService.forceBlockNow(duration);
    }

    @PostMapping("/cancel")
    public void cancelBlock() {
        blockingService.cancelCurrentBlock();
    }
}