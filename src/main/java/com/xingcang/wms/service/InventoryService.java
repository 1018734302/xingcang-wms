package com.xingcang.wms.service;

import com.xingcang.wms.mapper.InventoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryMapper inventoryMapper;

    public List<Map<String, Object>> list(String productId, String warehouseId, String locationId, String keyword) {
        return inventoryMapper.selectViews(blankToNull(productId), blankToNull(warehouseId),
                blankToNull(locationId), blankToNull(keyword));
    }

    private String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }
}
