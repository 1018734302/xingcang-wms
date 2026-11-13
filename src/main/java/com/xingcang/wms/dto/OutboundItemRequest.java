package com.xingcang.wms.dto;

import lombok.Data;

@Data
public class OutboundItemRequest {
    private String productId;
    private Integer qty;
}
