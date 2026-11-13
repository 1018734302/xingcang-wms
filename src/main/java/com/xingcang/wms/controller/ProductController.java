package com.xingcang.wms.controller;

import com.xingcang.wms.entity.Product;
import com.xingcang.wms.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<Product> list(@RequestParam(required = false) String keyword) {
        return productService.list(keyword);
    }

    @PostMapping
    public Product create(@RequestBody Product req) {
        return productService.create(req);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable String id, @RequestBody Product req) {
        return productService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable String id) {
        productService.delete(id);
        return Map.of("message", "已删除");
    }
}
