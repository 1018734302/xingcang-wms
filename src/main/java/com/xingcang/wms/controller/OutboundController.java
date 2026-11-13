package com.xingcang.wms.controller;

import com.xingcang.wms.dto.OutboundCreateRequest;
import com.xingcang.wms.service.OutboundService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/outbound")
@RequiredArgsConstructor
public class OutboundController {

    private final OutboundService outboundService;

    @GetMapping
    public List<Map<String, Object>> list() {
        return outboundService.list();
    }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable String id) {
        return outboundService.detail(id);
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody OutboundCreateRequest req) {
        return outboundService.create(req);
    }

    @PostMapping("/{id}/confirm")
    public Map<String, Object> confirm(@PathVariable String id) {
        return outboundService.confirm(id);
    }

    @PostMapping("/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable String id) {
        return outboundService.cancel(id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        outboundService.delete(id);
        return Map.of("message", "已删除");
    }
}
