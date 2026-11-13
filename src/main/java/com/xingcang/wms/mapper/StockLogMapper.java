package com.xingcang.wms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xingcang.wms.entity.StockLog;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

public interface StockLogMapper extends BaseMapper<StockLog> {

    @Select({"<script>",
            "SELECT l.id AS id, l.type AS type, l.product_id AS productId, l.location_id AS locationId,",
            "l.qty AS qty, l.ref_no AS refNo, l.remark AS remark, l.created_at AS createdAt,",
            "p.name AS productName, p.code AS productCode, p.unit AS unit,",
            "loc.code AS locationCode, loc.warehouse_id AS warehouseId",
            "FROM stock_log l",
            "LEFT JOIN product p ON p.id = l.product_id",
            "LEFT JOIN location loc ON loc.id = l.location_id",
            "WHERE 1 = 1",
            "<if test='type != null and type != \"\"'> AND l.type = #{type}</if>",
            "<if test='keyword != null and keyword != \"\"'> AND (p.name LIKE CONCAT('%', #{keyword}, '%')",
            " OR l.ref_no LIKE CONCAT('%', #{keyword}, '%') OR loc.code LIKE CONCAT('%', #{keyword}, '%'))</if>",
            "ORDER BY l.created_at DESC LIMIT #{limit}",
            "</script>"})
    List<Map<String, Object>> selectViews(@Param("type") String type,
                                          @Param("keyword") String keyword,
                                          @Param("limit") int limit);
}
