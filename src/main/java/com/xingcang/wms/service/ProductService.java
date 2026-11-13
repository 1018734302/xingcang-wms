package com.xingcang.wms.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.xingcang.wms.common.ApiException;
import com.xingcang.wms.common.Ids;
import com.xingcang.wms.entity.Inventory;
import com.xingcang.wms.entity.Product;
import com.xingcang.wms.mapper.InventoryMapper;
import com.xingcang.wms.mapper.ProductMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductMapper productMapper;
    private final InventoryMapper inventoryMapper;

    public List<Product> list(String keyword) {
        var qw = Wrappers.<Product>lambdaQuery();
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim();
            qw.and(w -> w.like(Product::getName, kw).or().like(Product::getCode, kw).or().like(Product::getBarcode, kw));
        }
        qw.orderByAsc(Product::getCode);
        List<Product> list = productMapper.selectList(qw);

        Map<String, Integer> sums = new HashMap<>();
        for (Map<String, Object> row : inventoryMapper.sumByProduct()) {
            sums.put((String) row.get("productId"), ((Number) row.get("qty")).intValue());
        }
        for (Product p : list) {
            p.setStock(sums.getOrDefault(p.getId(), 0));
        }
        return list;
    }

    public Product create(Product req) {
        if (!StringUtils.hasText(req.getCode()) || !StringUtils.hasText(req.getName())) {
            throw new ApiException(400, "商品编码与名称必填");
        }
        Long exists = productMapper.selectCount(Wrappers.<Product>lambdaQuery().eq(Product::getCode, req.getCode()));
        if (exists != null && exists > 0) {
            throw new ApiException(409, "商品编码已存在");
        }
        req.setId(Ids.gen("p"));
        req.setCreatedAt(LocalDateTime.now());
        if (req.getSpec() == null) req.setSpec("");
        if (req.getUnit() == null) req.setUnit("个");
        if (req.getCategory() == null) req.setCategory("未分类");
        if (req.getBarcode() == null) req.setBarcode("");
        if (req.getSafetyStock() == null) req.setSafetyStock(0);
        productMapper.insert(req);
        return req;
    }

    public Product update(String id, Product req) {
        Product p = productMapper.selectById(id);
        if (p == null) {
            throw new ApiException(404, "商品不存在");
        }
        if (StringUtils.hasText(req.getCode()) && !req.getCode().equals(p.getCode())) {
            Long exists = productMapper.selectCount(Wrappers.<Product>lambdaQuery().eq(Product::getCode, req.getCode()));
            if (exists != null && exists > 0) {
                throw new ApiException(409, "商品编码已存在");
            }
            p.setCode(req.getCode());
        }
        if (req.getName() != null) p.setName(req.getName());
        if (req.getSpec() != null) p.setSpec(req.getSpec());
        if (req.getUnit() != null) p.setUnit(req.getUnit());
        if (req.getCategory() != null) p.setCategory(req.getCategory());
        if (req.getBarcode() != null) p.setBarcode(req.getBarcode());
        if (req.getSafetyStock() != null) p.setSafetyStock(req.getSafetyStock());
        productMapper.updateById(p);
        return p;
    }

    public void delete(String id) {
        Product p = productMapper.selectById(id);
        if (p == null) {
            throw new ApiException(404, "商品不存在");
        }
        long total = inventoryMapper.selectList(Wrappers.<Inventory>lambdaQuery().eq(Inventory::getProductId, id))
                .stream().mapToLong(i -> i.getQty() == null ? 0 : i.getQty()).sum();
        if (total > 0) {
            throw new ApiException(400, "该商品仍有库存，无法删除");
        }
        inventoryMapper.delete(Wrappers.<Inventory>lambdaQuery().eq(Inventory::getProductId, id));
        productMapper.deleteById(id);
    }
}
