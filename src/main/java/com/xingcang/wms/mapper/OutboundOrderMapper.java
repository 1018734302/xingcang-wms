package com.xingcang.wms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xingcang.wms.entity.OutboundOrder;
import org.apache.ibatis.annotations.Select;

public interface OutboundOrderMapper extends BaseMapper<OutboundOrder> {

    @Select("SELECT COUNT(*) FROM outbound_order WHERE DATE(created_at) = CURDATE() OR DATE(confirmed_at) = CURDATE()")
    Long countToday();
}
