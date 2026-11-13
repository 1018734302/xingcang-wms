package com.xingcang.wms.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.xingcang.wms.common.ApiException;
import com.xingcang.wms.common.Ids;
import com.xingcang.wms.dto.OutboundCreateRequest;
import com.xingcang.wms.dto.OutboundItemRequest;
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
public class OutboundService {

    private final OutboundOrderMapper orderMapper;
    private final OutboundItemMapper itemMapper;
    private final ProductMapper productMapper;
    private final WarehouseMapper warehouseMapper;
    private final InventoryMapper inventoryMapper;
    private final StockLogMapper logMapper;
    private final OrderNoGenerator noGenerator;

    public List<Map<String, Object>> list() {
        List<OutboundOrder> orders = orderMapper.selectList(
                Wrappers.<OutboundOrder>lambdaQuery().orderByDesc(OutboundOrder::getCreatedAt));
        return buildViews(orders);
    }

    public Map<String, Object> detail(String id) {
        OutboundOrder o = orderMapper.selectById(id);
        if (o == null) {
            throw new ApiException(404, "出库单不存在");
        }
        return buildViews(List.of(o)).get(0);
    }

    @Transactional
    public Map<String, Object> create(OutboundCreateRequest req) {
        if (!StringUtils.hasText(req.getWarehouseId())) {
            throw new ApiException(400, "请选择仓库");
        }
        if (warehouseMapper.selectById(req.getWarehouseId()) == null) {
            throw new ApiException(400, "仓库不存在");
        }
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new ApiException(400, "请至少添加一条明细");
        }
        for (OutboundItemRequest it : req.getItems()) {
            if (productMapper.selectById(it.getProductId()) == null) {
                throw new ApiException(400, "存在无效商品");
            }
            if (it.getQty() == null || it.getQty() <= 0) {
                throw new ApiException(400, "数量必须大于 0");
            }
        }

        OutboundOrder o = new OutboundOrder();
        o.setId(Ids.gen("out"));
        o.setNo(noGenerator.next("CK", "outbound"));
        o.setCustomer(req.getCustomer());
        o.setWarehouseId(req.getWarehouseId());
        o.setRemark(req.getRemark());
        o.setStatus("PENDING");
        o.setCreatedAt(LocalDateTime.now());
        orderMapper.insert(o);

        for (OutboundItemRequest it : req.getItems()) {
            OutboundItem item = new OutboundItem();
            item.setId(Ids.gen("outi"));
            item.setOrderId(o.getId());
            item.setProductId(it.getProductId());
            item.setQty(it.getQty());
            itemMapper.insert(item);
        }
        return detail(o.getId());
    }

    @Transactional
    public Map<String, Object> confirm(String id) {
        OutboundOrder o = orderMapper.selectById(id);
        if (o == null) {
            throw new ApiException(404, "出库单不存在");
        }
        if (!"PENDING".equals(o.getStatus())) {
            throw new ApiException(400, "仅待出库单据可确认");
        }
        List<OutboundItem> items = itemMapper.selectList(
                Wrappers.<OutboundItem>lambdaQuery().eq(OutboundItem::getOrderId, id));

        // 同一商品可能出现在多行，先按商品聚合需求量再校验
        Map<String, Integer> needByProduct = new LinkedHashMap<>();
        for (OutboundItem it : items) {
            needByProduct.merge(it.getProductId(), it.getQty(), Integer::sum);
        }
        List<String> shortages = new ArrayList<>();
        for (Map.Entry<String, Integer> e : needByProduct.entrySet()) {
            Long avail = inventoryMapper.sumByProductAndWarehouse(e.getKey(), o.getWarehouseId());
            long a = avail == null ? 0 : avail;
            if (a < e.getValue()) {
                Product p = productMapper.selectById(e.getKey());
                shortages.add((p != null ? p.getName() : e.getKey()) + " 需 " + e.getValue() + "，可用 " + a);
            }
        }
        if (!shortages.isEmpty()) {
            throw new ApiException(400, "库存不足：" + String.join("；", shortages));
        }

        LocalDateTime now = LocalDateTime.now();
        for (OutboundItem it : items) {
            int need = it.getQty();
            List<Inventory> records = inventoryMapper.findAvailable(it.getProductId(), o.getWarehouseId());
            for (Inventory rec : records) {
                if (need <= 0) break;
                int take = Math.min(rec.getQty(), need);
                rec.setQty(rec.getQty() - take);
                rec.setUpdatedAt(now);
                inventoryMapper.updateById(rec);
                need -= take;

                StockLog log = new StockLog();
                log.setId(Ids.gen("log"));
                log.setType("OUT");
                log.setProductId(it.getProductId());
                log.setLocationId(rec.getLocationId());
                log.setQty(take);
                log.setRefNo(o.getNo());
                log.setRemark("出库拣货");
                log.setCreatedAt(now);
                logMapper.insert(log);
            }
        }

        o.setStatus("COMPLETED");
        o.setConfirmedAt(now);
        orderMapper.updateById(o);
        return detail(id);
    }

    public Map<String, Object> cancel(String id) {
        OutboundOrder o = orderMapper.selectById(id);
        if (o == null) {
            throw new ApiException(404, "出库单不存在");
        }
        if (!"PENDING".equals(o.getStatus())) {
            throw new ApiException(400, "仅待出库单据可作废");
        }
        o.setStatus("CANCELLED");
        orderMapper.updateById(o);
        return detail(id);
    }

    @Transactional
    public void delete(String id) {
        OutboundOrder o = orderMapper.selectById(id);
        if (o == null) {
            throw new ApiException(404, "出库单不存在");
        }
        if ("COMPLETED".equals(o.getStatus())) {
            throw new ApiException(400, "已完成的出库单不可删除");
        }
        itemMapper.delete(Wrappers.<OutboundItem>lambdaQuery().eq(OutboundItem::getOrderId, id));
        orderMapper.deleteById(id);
    }

    private List<Map<String, Object>> buildViews(List<OutboundOrder> orders) {
        if (orders.isEmpty()) {
            return List.of();
        }
        Map<String, Warehouse> whMap = warehouseMapper.selectList(null).stream()
                .collect(Collectors.toMap(Warehouse::getId, w -> w, (a, b) -> a));
        Map<String, Product> productMap = productMapper.selectList(null).stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        List<String> orderIds = orders.stream().map(OutboundOrder::getId).toList();
        List<OutboundItem> allItems = itemMapper.selectList(
                Wrappers.<OutboundItem>lambdaQuery().in(OutboundItem::getOrderId, orderIds));
        Map<String, List<OutboundItem>> grouped = allItems.stream()
                .collect(Collectors.groupingBy(OutboundItem::getOrderId));

        List<Map<String, Object>> result = new ArrayList<>();
        for (OutboundOrder o : orders) {
            Map<String, Object> v = new LinkedHashMap<>();
            v.put("id", o.getId());
            v.put("no", o.getNo());
            v.put("customer", o.getCustomer());
            v.put("warehouseId", o.getWarehouseId());
            v.put("status", o.getStatus());
            v.put("remark", o.getRemark());
            v.put("createdAt", o.getCreatedAt());
            v.put("confirmedAt", o.getConfirmedAt());
            Warehouse w = whMap.get(o.getWarehouseId());
            v.put("warehouseName", w != null ? w.getName() : "未知仓库");

            List<Map<String, Object>> itemViews = new ArrayList<>();
            int total = 0;
            for (OutboundItem it : grouped.getOrDefault(o.getId(), List.of())) {
                Product p = productMap.get(it.getProductId());
                Map<String, Object> iv = new LinkedHashMap<>();
                iv.put("productId", it.getProductId());
                iv.put("qty", it.getQty());
                iv.put("productName", p != null ? p.getName() : "未知商品");
                iv.put("productCode", p != null ? p.getCode() : "");
                iv.put("unit", p != null ? p.getUnit() : "");
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
