package com.xingcang.wms.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.xingcang.wms.common.ApiException;
import com.xingcang.wms.common.Ids;
import com.xingcang.wms.entity.Location;
import com.xingcang.wms.entity.Warehouse;
import com.xingcang.wms.mapper.LocationMapper;
import com.xingcang.wms.mapper.WarehouseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseMapper warehouseMapper;
    private final LocationMapper locationMapper;

    public List<Warehouse> list() {
        List<Warehouse> list = warehouseMapper.selectList(Wrappers.<Warehouse>lambdaQuery().orderByAsc(Warehouse::getCode));
        Map<String, Long> counts = locationMapper.selectList(null).stream()
                .collect(Collectors.groupingBy(Location::getWarehouseId, Collectors.counting()));
        list.forEach(w -> w.setLocationCount(counts.getOrDefault(w.getId(), 0L)));
        return list;
    }

    public Warehouse create(Warehouse req) {
        if (!StringUtils.hasText(req.getCode()) || !StringUtils.hasText(req.getName())) {
            throw new ApiException(400, "仓库编码与名称必填");
        }
        Long exists = warehouseMapper.selectCount(Wrappers.<Warehouse>lambdaQuery().eq(Warehouse::getCode, req.getCode()));
        if (exists != null && exists > 0) {
            throw new ApiException(409, "仓库编码已存在");
        }
        req.setId(Ids.gen("wh"));
        req.setCreatedAt(LocalDateTime.now());
        if (req.getAddress() == null) req.setAddress("");
        if (req.getManager() == null) req.setManager("");
        if (req.getPhone() == null) req.setPhone("");
        warehouseMapper.insert(req);
        return req;
    }

    public Warehouse update(String id, Warehouse req) {
        Warehouse w = warehouseMapper.selectById(id);
        if (w == null) {
            throw new ApiException(404, "仓库不存在");
        }
        if (StringUtils.hasText(req.getCode()) && !req.getCode().equals(w.getCode())) {
            Long exists = warehouseMapper.selectCount(Wrappers.<Warehouse>lambdaQuery().eq(Warehouse::getCode, req.getCode()));
            if (exists != null && exists > 0) {
                throw new ApiException(409, "仓库编码已存在");
            }
            w.setCode(req.getCode());
        }
        if (req.getName() != null) w.setName(req.getName());
        if (req.getAddress() != null) w.setAddress(req.getAddress());
        if (req.getManager() != null) w.setManager(req.getManager());
        if (req.getPhone() != null) w.setPhone(req.getPhone());
        warehouseMapper.updateById(w);
        return w;
    }

    public void delete(String id) {
        Warehouse w = warehouseMapper.selectById(id);
        if (w == null) {
            throw new ApiException(404, "仓库不存在");
        }
        Long count = locationMapper.selectCount(Wrappers.<Location>lambdaQuery().eq(Location::getWarehouseId, id));
        if (count != null && count > 0) {
            throw new ApiException(400, "仓库下仍有库位，无法删除");
        }
        warehouseMapper.deleteById(id);
    }
}
