package com.xingcang.wms.controller;

import com.xingcang.wms.mapper.StockLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final StockLogMapper stockLogMapper;

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String type,
                                          @RequestParam(required = false) String keyword,
                                          @RequestParam(defaultValue = "200") int limit) {
        return stockLogMapper.selectViews(blankToNull(type), blankToNull(keyword), limit);
    }

    private String blankToNull(String s) {
        return StringUtils.hasText(s) ? s.trim() : null;
    }
}
