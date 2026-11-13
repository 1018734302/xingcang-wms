package com.xingcang.wms.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xingcang.wms.entity.Inventory;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

public interface InventoryMapper extends BaseMapper<Inventory> {

    @Select({"<script>",
            "SELECT i.id AS id, i.product_id AS productId, p.code AS productCode, p.name AS productName,",
            "p.spec AS spec, p.unit AS unit, i.location_id AS locationId, l.code AS locationCode,",
            "l.warehouse_id AS warehouseId, w.name AS warehouseName, i.batch_no AS batchNo,",
            "i.qty AS qty, i.updated_at AS updatedAt",
            "FROM inventory i",
            "JOIN product p ON p.id = i.product_id",
            "JOIN location l ON l.id = i.location_id",
            "JOIN warehouse w ON w.id = l.warehouse_id",
            "WHERE i.qty &gt; 0",
            "<if test='productId != null and productId != \"\"'> AND i.product_id = #{productId}</if>",
            "<if test='warehouseId != null and warehouseId != \"\"'> AND l.warehouse_id = #{warehouseId}</if>",
            "<if test='locationId != null and locationId != \"\"'> AND i.location_id = #{locationId}</if>",
            "<if test='keyword != null and keyword != \"\"'> AND (p.name LIKE CONCAT('%', #{keyword}, '%')",
            " OR p.code LIKE CONCAT('%', #{keyword}, '%') OR l.code LIKE CONCAT('%', #{keyword}, '%'))</if>",
            "ORDER BY p.code, l.code",
            "</script>"})
    List<Map<String, Object>> selectViews(@Param("productId") String productId,
                                          @Param("warehouseId") String warehouseId,
                                          @Param("locationId") String locationId,
                                          @Param("keyword") String keyword);

    @Select("SELECT COALESCE(SUM(qty), 0) FROM inventory")
    Long totalQty();

    @Select("SELECT COUNT(DISTINCT location_id) FROM inventory WHERE qty > 0")
    Long occupiedLocations();

    @Select("SELECT product_id AS productId, COALESCE(SUM(qty), 0) AS qty FROM inventory GROUP BY product_id")
    List<Map<String, Object>> sumByProduct();

    @Select("SELECT location_id AS locationId, COALESCE(SUM(qty), 0) AS qty FROM inventory GROUP BY location_id")
    List<Map<String, Object>> sumByLocation();

    @Select("SELECT w.id AS warehouseId, w.name AS warehouseName, COALESCE(SUM(i.qty), 0) AS qty " +
            "FROM warehouse w " +
            "LEFT JOIN location l ON l.warehouse_id = w.id " +
            "LEFT JOIN inventory i ON i.location_id = l.id AND i.qty > 0 " +
            "GROUP BY w.id, w.name")
    List<Map<String, Object>> sumByWarehouse();

    @Select("SELECT COALESCE(SUM(i.qty), 0) FROM inventory i JOIN location l ON l.id = i.location_id " +
            "WHERE i.product_id = #{productId} AND l.warehouse_id = #{warehouseId}")
    Long sumByProductAndWarehouse(@Param("productId") String productId, @Param("warehouseId") String warehouseId);

    @Select("SELECT i.* FROM inventory i JOIN location l ON l.id = i.location_id " +
            "WHERE i.product_id = #{productId} AND l.warehouse_id = #{warehouseId} AND i.qty > 0 " +
            "ORDER BY i.qty DESC")
    List<Inventory> findAvailable(@Param("productId") String productId, @Param("warehouseId") String warehouseId);
}
