package com.xingcang.wms.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface OrderSeqMapper {

    @Insert("INSERT INTO order_seq(seq_key, val) VALUES(#{key}, 1) ON DUPLICATE KEY UPDATE val = val + 1")
    int bump(@Param("key") String key);

    @Select("SELECT val FROM order_seq WHERE seq_key = #{key}")
    Integer get(@Param("key") String key);
}
