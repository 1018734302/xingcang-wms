package com.xingcang.wms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("stock_log")
public class StockLog {
    @TableId(type = IdType.INPUT)
    private String id;
    private String type;
    private String productId;
    private String locationId;
    private Integer qty;
    private String refNo;
    private String remark;
    private LocalDateTime createdAt;
}
