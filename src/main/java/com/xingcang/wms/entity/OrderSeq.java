package com.xingcang.wms.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("order_seq")
public class OrderSeq {
    @TableId(type = IdType.INPUT)
    private String seqKey;
    private Integer val;
}
