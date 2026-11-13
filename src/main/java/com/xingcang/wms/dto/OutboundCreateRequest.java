package com.xingcang.wms.dto;

import lombok.Data;

import java.util.List;

@Data
public class OutboundCreateRequest {
    private String customer;
    private String warehouseId;
    private String remark;
    private List<OutboundItemRequest> items;
}
