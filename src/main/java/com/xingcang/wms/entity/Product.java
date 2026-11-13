package com.xingcang.wms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("product")
public class Product {
    @TableId(type = IdType.INPUT)
    private String id;
    private String code;
    private String name;
    private String spec;
    private String unit;
    private String category;
    private String barcode;
    private Integer safetyStock;
    private LocalDateTime createdAt;

    @TableField(exist = false)
    private Integer stock;
}
