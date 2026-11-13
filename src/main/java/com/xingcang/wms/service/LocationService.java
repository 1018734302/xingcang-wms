package com.xingcang.wms.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.xingcang.wms.common.ApiException;
import com.xingcang.wms.common.Ids;
import com.xingcang.wms.entity.Inventory;
import com.xingcang.wms.entity.Location;
import com.xingcang.wms.mapper.InventoryMapper;
import com.xingcang.wms.mapper.LocationMapper;
import com.xingcang.wms.mapper.WarehouseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationMapper locationMapper;
    private final InventoryMapper inventoryMapper;
    private final WarehouseMapper warehouseMapper;

    public List<Location> list(String warehouseId, String keyword) {
        var qw = Wrappers.<Location>lambdaQuery();
        if (StringUtils.hasText(warehouseId)) {
            qw.eq(Location::getWarehouseId, warehouseId.trim());
        }
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim();
            qw.and(w -> w.like(Location::getCode, kw).or().like(Location::getZone, kw));
        }
        qw.orderByAsc(Location::getCode);
        List<Location> list = locationMapper.selectList(qw);

        Map<String, Integer> usedMap = new HashMap<>();
        for (Map<String, Object> row : inventoryMapper.sumByLocation()) {
            usedMap.put((String) row.get("locationId"), ((Number) row.get("qty")).intValue());
        }
        for (Location l : list) {
            int used = usedMap.getOrDefault(l.getId(), 0);
            l.setUsed(used);
            int cap = l.getCapacity() == null ? 0 : l.getCapacity();
            l.setOccupancy(cap > 0 ? Math.min(100, (int) Math.round(used * 100.0 / cap)) : 0);
        }
        return list;
    }

    public Location create(Location req) {
        if (!StringUtils.hasText(req.getWarehouseId()) || !StringUtils.hasText(req.getCode())) {
            throw new ApiException(400, "仓库与库位编码必填");
        }
        if (warehouseMapper.selectById(req.getWarehouseId()) == null) {
            throw new ApiException(400, "仓库不存在");
        }
        Long exists = locationMapper.selectCount(Wrappers.<Location>lambdaQuery()
                .eq(Location::getWarehouseId, req.getWarehouseId())
                .eq(Location::getCode, req.getCode()));
        if (exists != null && exists > 0) {
            throw new ApiException(409, "该仓库下库位编码已存在");
        }
        req.setId(Ids.gen("loc"));
        if (req.getZone() == null) req.setZone("A");
        if (req.getCapacity() == null) req.setCapacity(100);
        req.setStatus("ENABLED");
        locationMapper.insert(req);
        return req;
    }

    public Location update(String id, Location req) {
        Location l = locationMapper.selectById(id);
        if (l == null) {
            throw new ApiException(404, "库位不存在");
        }
        if (req.getCode() != null) l.setCode(req.getCode());
        if (req.getZone() != null) l.setZone(req.getZone());
        if (req.getCapacity() != null) l.setCapacity(req.getCapacity());
        if (req.getStatus() != null) l.setStatus(req.getStatus());
        locationMapper.updateById(l);
        return l;
    }

    public void delete(String id) {
        Location l = locationMapper.selectById(id);
        if (l == null) {
            throw new ApiException(404, "库位不存在");
        }
        Long total = inventoryMapper.selectCount(Wrappers.<Inventory>lambdaQuery()
                .eq(Inventory::getLocationId, id)
                .gt(Inventory::getQty, 0));
        if (total != null && total > 0) {
            throw new ApiException(400, "该库位仍有库存，无法删除");
        }
        locationMapper.deleteById(id);
    }
}
