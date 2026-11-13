package com.xingcang.wms.controller;

import com.xingcang.wms.entity.Warehouse;
import com.xingcang.wms.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    public List<Warehouse> list() {
        return warehouseService.list();
    }

    @PostMapping
    public Warehouse create(@RequestBody Warehouse req) {
        return warehouseService.create(req);
    }

    @PutMapping("/{id}")
    public Warehouse update(@PathVariable String id, @RequestBody Warehouse req) {
        return warehouseService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        warehouseService.delete(id);
        return Map.of("message", "已删除");
    }
}
