package com.xingcang.wms.dto;

import lombok.Data;

@Data
public class InboundItemRequest {
    private String productId;
    private Integer qty;
    private String locationId;
}
