package com.xingcang.wms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("inbound_item")
public class InboundItem {
    @TableId(type = IdType.INPUT)
    private String id;
    private String orderId;
    private String productId;
    private Integer qty;
    private String locationId;
}
