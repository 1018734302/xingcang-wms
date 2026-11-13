package com.xingcang.wms.controller;

import com.xingcang.wms.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String productId,
                                          @RequestParam(required = false) String warehouseId,
                                          @RequestParam(required = false) String locationId,
                                          @RequestParam(required = false) String keyword) {
        return inventoryService.list(productId, warehouseId, locationId, keyword);
    }
}
