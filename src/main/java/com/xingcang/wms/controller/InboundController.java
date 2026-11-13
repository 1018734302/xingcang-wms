package com.xingcang.wms.controller;

import com.xingcang.wms.dto.InboundCreateRequest;
import com.xingcang.wms.service.InboundService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inbound")
@RequiredArgsConstructor
public class InboundController {

    private final InboundService inboundService;

    @GetMapping
    public List<Map<String, Object>> list() {
        return inboundService.list();
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable String id) {
        return inboundService.detail(id);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody InboundCreateRequest req) {
        return inboundService.create(req);
    }

    @PostMapping("/{id}/confirm")
    public Map<String, Object> confirm(@PathVariable String id) {
        return inboundService.confirm(id);
    }

    @PostMapping("/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable String id) {
        return inboundService.cancel(id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        inboundService.delete(id);
        return Map.of("message", "已删除");
    }
}
