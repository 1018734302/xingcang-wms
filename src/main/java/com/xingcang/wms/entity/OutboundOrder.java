package com.xingcang.wms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("outbound_order")
public class OutboundOrder {
    @TableId(type = IdType.INPUT)
    private String id;
    private String no;
    private String customer;
    private String warehouseId;
    private String status;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
}
