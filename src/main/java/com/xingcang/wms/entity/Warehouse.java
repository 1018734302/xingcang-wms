package com.xingcang.wms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("warehouse")
public class Warehouse {
    @TableId(type = IdType.INPUT)
    private String id;
    private String code;
    private String name;
    private String address;
    private String manager;
    private String phone;
    private LocalDateTime createdAt;

    @TableField(exist = false)
    private Long locationCount;
}
