package com.xingcang.wms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("inventory")
public class Inventory {
    @TableId(type = IdType.INPUT)
    private String id;
    private String productId;
    private String locationId;
    private String batchNo;
    private Integer qty;
    private LocalDateTime updatedAt;
}
