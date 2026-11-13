package com.xingcang.wms.dto;

import lombok.Data;

import java.util.List;

@Data
public class InboundCreateRequest {
    private String supplier;
    private String warehouseId;
    private String remark;
    private List<InboundItemRequest> items;
}
