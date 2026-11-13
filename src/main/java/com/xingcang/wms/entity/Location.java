package com.xingcang.wms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("location")
public class Location {
    @TableId(type = IdType.INPUT)
    private String id;
    private String warehouseId;
    private String code;
    private String zone;
    private Integer capacity;
    private String status;

    @TableField(exist = false)
    private Integer used;
    @TableField(exist = false)
    private Integer occupancy;
}
