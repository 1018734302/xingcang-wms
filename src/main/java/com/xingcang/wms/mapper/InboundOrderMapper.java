package com.xingcang.wms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xingcang.wms.entity.InboundOrder;
import org.apache.ibatis.annotations.Select;

public interface InboundOrderMapper extends BaseMapper<InboundOrder> {

    @Select("SELECT COUNT(*) FROM inbound_order WHERE DATE(created_at) = CURDATE() OR DATE(confirmed_at) = CURDATE()")
    Long countToday();
}
