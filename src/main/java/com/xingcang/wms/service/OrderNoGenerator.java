package com.xingcang.wms.service;

import com.xingcang.wms.mapper.OrderSeqMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class OrderNoGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.BASIC_ISO_DATE;

    private final OrderSeqMapper orderSeqMapper;

    /**
     * 生成形如 RK20261112-001 的单号，序列按「业务 + 日期」维度自增。
     * 需在事务内调用，保证 bump/get 的原子性。
     */
    public String next(String prefix, String biz) {
        String date = LocalDate.now().format(DATE_FMT);
        String key = biz + "-" + date;
        orderSeqMapper.bump(key);
        Integer val = orderSeqMapper.get(key);
        int seq = val == null ? 1 : val;
        return prefix + date + "-" + String.format("%03d", seq);
    }
}
