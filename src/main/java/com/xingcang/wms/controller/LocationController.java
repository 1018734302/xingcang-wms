package com.xingcang.wms.controller;

import com.xingcang.wms.entity.Location;
import com.xingcang.wms.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public List<Location> list(@RequestParam(required = false) String warehouseId,
                               @RequestParam(required = false) String keyword) {
        return locationService.list(warehouseId, keyword);
    }

    @PostMapping
    public Location create(@RequestBody Location req) {
        return locationService.create(req);
    }

    @PutMapping("/{id}")
    public Location update(@PathVariable String id, @RequestBody Location req) {
        return locationService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        locationService.delete(id);
        return Map.of("message", "已删除");
    }
}
