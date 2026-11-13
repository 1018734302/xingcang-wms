package com.xingcang.wms.service;

import com.xingcang.wms.entity.Product;
import com.xingcang.wms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductMapper productMapper;
    private final WarehouseMapper warehouseMapper;
    private final LocationMapper locationMapper;
    private final InventoryMapper inventoryMapper;
    private final InboundOrderMapper inboundOrderMapper;
    private final OutboundOrderMapper outboundOrderMapper;
    private final StockLogMapper logMapper;

    public Map<String, Object> dashboard() {
        long totalStock = nz(inventoryMapper.totalQty());
        long occupied = nz(inventoryMapper.occupiedLocations());

        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("products", nz(productMapper.selectCount(null)));
        counts.put("warehouses", nz(warehouseMapper.selectCount(null)));
        counts.put("locations", nz(locationMapper.selectCount(null)));
        counts.put("locationsOccupied", occupied);
        counts.put("inboundOrders", nz(inboundOrderMapper.selectCount(null)));
        counts.put("outboundOrders", nz(outboundOrderMapper.selectCount(null)));

        Map<String, Integer> sums = new HashMap<>();
        for (Map<String, Object> row : inventoryMapper.sumByProduct()) {
            sums.put((String) row.get("productId"), ((Number) row.get("qty")).intValue());
        }

        List<Map<String, Object>> lowStock = new ArrayList<>();
        for (Product p : productMapper.selectList(null)) {
            int qty = sums.getOrDefault(p.getId(), 0);
            if (p.getSafetyStock() != null && p.getSafetyStock() > 0 && qty < p.getSafetyStock()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("productId", p.getId());
                m.put("productName", p.getName());
                m.put("productCode", p.getCode());
                m.put("qty", qty);
                m.put("safetyStock", p.getSafetyStock());
                m.put("unit", p.getUnit());
                lowStock.add(m);
            }
        }
        lowStock.sort(Comparator.comparingDouble(m ->
                ((Integer) m.get("qty")) / (double) ((Integer) m.get("safetyStock"))));
        if (lowStock.size() > 8) {
            lowStock = new ArrayList<>(lowStock.subList(0, 8));
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("counts", counts);
        res.put("totalStock", totalStock);
        res.put("todayInbound", nz(inboundOrderMapper.countToday()));
        res.put("todayOutbound", nz(outboundOrderMapper.countToday()));
        res.put("lowStock", lowStock);
        res.put("byWarehouse", inventoryMapper.sumByWarehouse());
        res.put("recentLogs", logMapper.selectViews(null, null, 8));
        return res;
    }

    private long nz(Number n) {
        return n == null ? 0L : n.longValue();
    }
}
