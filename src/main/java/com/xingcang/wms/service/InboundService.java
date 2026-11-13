package com.xingcang.wms.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.xingcang.wms.common.ApiException;
import com.xingcang.wms.common.Ids;
import com.xingcang.wms.dto.InboundCreateRequest;
import com.xingcang.wms.dto.InboundItemRequest;
import com.xingcang.wms.entity.*;
import com.xingcang.wms.mapper.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InboundService {

    private final InboundOrderMapper orderMapper;
    private final InboundItemMapper itemMapper;
    private final ProductMapper productMapper;
    private final LocationMapper locationMapper;
    private final WarehouseMapper warehouseMapper;
    private final InventoryMapper inventoryMapper;
    private final StockLogMapper logMapper;
    private final OrderNoGenerator noGenerator;

    public List<Map<String, Object>> list() {
        List<InboundOrder> orders = orderMapper.selectList(
                Wrappers.<InboundOrder>lambdaQuery().orderByDesc(InboundOrder::getCreatedAt));
        return buildViews(orders);
    }

    public Map<String, Object> detail(String id) {
        InboundOrder o = orderMapper.selectById(id);
        if (o == null) {
            throw new ApiException(404, "入库单不存在");
        }
        return buildViews(List.of(o)).get(0);
    }

    @Transactional
    public Map<String, Object> create(InboundCreateRequest req) {
        if (!StringUtils.hasText(req.getWarehouseId())) {
            throw new ApiException(400, "请选择仓库");
        }
        if (warehouseMapper.selectById(req.getWarehouseId()) == null) {
            throw new ApiException(400, "仓库不存在");
        }
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new ApiException(400, "请至少添加一条明细");
        }
        for (InboundItemRequest it : req.getItems()) {
            if (productMapper.selectById(it.getProductId()) == null) {
                throw new ApiException(400, "存在无效商品");
            }
            if (locationMapper.selectById(it.getLocationId()) == null) {
                throw new ApiException(400, "存在无效库位");
            }
            if (it.getQty() == null || it.getQty() <= 0) {
                throw new ApiException(400, "数量必须大于 0");
            }
        }

        InboundOrder o = new InboundOrder();
        o.setId(Ids.gen("in"));
        o.setNo(noGenerator.next("RK", "inbound"));
        o.setSupplier(req.getSupplier());
        o.setWarehouseId(req.getWarehouseId());
        o.setRemark(req.getRemark());
        o.setStatus("PENDING");
        o.setCreatedAt(LocalDateTime.now());
        orderMapper.insert(o);

        for (InboundItemRequest it : req.getItems()) {
            InboundItem item = new InboundItem();
            item.setId(Ids.gen("ini"));
            item.setOrderId(o.getId());
            item.setProductId(it.getProductId());
            item.setQty(it.getQty());
            item.setLocationId(it.getLocationId());
            itemMapper.insert(item);
        }
        return detail(o.getId());
    }

    @Transactional
    public Map<String, Object> confirm(String id) {
        InboundOrder o = orderMapper.selectById(id);
        if (o == null) {
            throw new ApiException(404, "入库单不存在");
        }
        if (!"PENDING".equals(o.getStatus())) {
            throw new ApiException(400, "仅待入库单据可确认");
        }
        List<InboundItem> items = itemMapper.selectList(
                Wrappers.<InboundItem>lambdaQuery().eq(InboundItem::getOrderId, id));

        LocalDateTime now = LocalDateTime.now();
        for (InboundItem it : items) {
            Inventory inv = inventoryMapper.selectOne(Wrappers.<Inventory>lambdaQuery()
                    .eq(Inventory::getProductId, it.getProductId())
                    .eq(Inventory::getLocationId, it.getLocationId())
                    .eq(Inventory::getBatchNo, "DEFAULT"));
            if (inv != null) {
                inv.setQty(inv.getQty() + it.getQty());
                inv.setUpdatedAt(now);
                inventoryMapper.updateById(inv);
            } else {
                Inventory n = new Inventory();
                n.setId(Ids.gen("inv"));
                n.setProductId(it.getProductId());
                n.setLocationId(it.getLocationId());
                n.setBatchNo("DEFAULT");
                n.setQty(it.getQty());
                n.setUpdatedAt(now);
                inventoryMapper.insert(n);
            }

            StockLog log = new StockLog();
            log.setId(Ids.gen("log"));
            log.setType("IN");
            log.setProductId(it.getProductId());
            log.setLocationId(it.getLocationId());
            log.setQty(it.getQty());
            log.setRefNo(o.getNo());
            log.setRemark("入库上架");
            log.setCreatedAt(now);
            logMapper.insert(log);
        }

        o.setStatus("COMPLETED");
        o.setConfirmedAt(now);
        orderMapper.updateById(o);
        return detail(id);
    }

    public Map<String, Object> cancel(String id) {
        InboundOrder o = orderMapper.selectById(id);
        if (o == null) {
            throw new ApiException(404, "入库单不存在");
        }
        if (!"PENDING".equals(o.getStatus())) {
            throw new ApiException(400, "仅待入库单据可作废");
        }
        o.setStatus("CANCELLED");
        orderMapper.updateById(o);
        return detail(id);
    }

    @Transactional
    public void delete(String id) {
        InboundOrder o = orderMapper.selectById(id);
        if (o == null) {
            throw new ApiException(404, "入库单不存在");
        }
        if ("COMPLETED".equals(o.getStatus())) {
            throw new ApiException(400, "已完成的入库单不可删除");
        }
        itemMapper.delete(Wrappers.<InboundItem>lambdaQuery().eq(InboundItem::getOrderId, id));
        orderMapper.deleteById(id);
    }

    private List<Map<String, Object>> buildViews(List<InboundOrder> orders) {
        if (orders.isEmpty()) {
            return List.of();
        }
        Map<String, Warehouse> whMap = warehouseMapper.selectList(null).stream()
                .collect(Collectors.toMap(Warehouse::getId, w -> w, (a, b) -> a));
        Map<String, Product> productMap = productMapper.selectList(null).stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<String, Location> locMap = locationMapper.selectList(null).stream()
                .collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));

        List<String> orderIds = orders.stream().map(InboundOrder::getId).toList();
        List<InboundItem> allItems = itemMapper.selectList(
                Wrappers.<InboundItem>lambdaQuery().in(InboundItem::getOrderId, orderIds));
        Map<String, List<InboundItem>> grouped = allItems.stream()
                .collect(Collectors.groupingBy(InboundItem::getOrderId));

        List<Map<String, Object>> result = new ArrayList<>();
        for (InboundOrder o : orders) {
            Map<String, Object> v = new LinkedHashMap<>();
            v.put("id", o.getId());
            v.put("no", o.getNo());
            v.put("supplier", o.getSupplier());
            v.put("warehouseId", o.getWarehouseId());
            v.put("status", o.getStatus());
            v.put("remark", o.getRemark());
            v.put("createdAt", o.getCreatedAt());
            v.put("confirmedAt", o.getConfirmedAt());
            Warehouse w = whMap.get(o.getWarehouseId());
            v.put("warehouseName", w != null ? w.getName() : "未知仓库");

            List<Map<String, Object>> itemViews = new ArrayList<>();
            int total = 0;
            for (InboundItem it : grouped.getOrDefault(o.getId(), List.of())) {
                Product p = productMap.get(it.getProductId());
                Location loc = locMap.get(it.getLocationId());
                Map<String, Object> iv = new LinkedHashMap<>();
                iv.put("productId", it.getProductId());
                iv.put("qty", it.getQty());
                iv.put("locationId", it.getLocationId());
                iv.put("productName", p != null ? p.getName() : "未知商品");
                iv.put("productCode", p != null ? p.getCode() : "");
                iv.put("unit", p != null ? p.getUnit() : "");
                iv.put("locationCode", loc != null ? loc.getCode() : "");
                itemViews.add(iv);
                total += it.getQty() == null ? 0 : it.getQty();
            }
            v.put("items", itemViews);
            v.put("totalQty", total);
            result.add(v);
        }
        return result;
    }
}
