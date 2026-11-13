INSERT IGNORE INTO warehouse (id, code, name, address, manager, phone, created_at)
VALUES ('wh_sh01', 'WH-SH01', '上海一号仓', '上海市浦东新区物流园 8 号', '张伟', '13800000001', NOW());

INSERT IGNORE INTO location (id, warehouse_id, code, zone, capacity, status)
VALUES ('loc_a0101', 'wh_sh01', 'A-01-01', 'A', 100, 'ENABLED'),
       ('loc_a0102', 'wh_sh01', 'A-01-02', 'A', 100, 'ENABLED'),
       ('loc_a0201', 'wh_sh01', 'A-02-01', 'A', 120, 'ENABLED'),
       ('loc_b0101', 'wh_sh01', 'B-01-01', 'B', 80, 'ENABLED'),
       ('loc_b0102', 'wh_sh01', 'B-01-02', 'B', 80, 'ENABLED'),
       ('loc_c0101', 'wh_sh01', 'C-01-01', 'C', 200, 'ENABLED'),
       ('loc_c0102', 'wh_sh01', 'C-01-02', 'C', 200, 'ENABLED'),
       ('loc_c0103', 'wh_sh01', 'C-01-03', 'C', 200, 'ENABLED');

INSERT IGNORE INTO product (id, code, name, spec, unit, category, barcode, safety_stock, created_at)
VALUES ('p_001', 'SKU-1001', '无线蓝牙耳机', '白色 / 标准版', '个', '电子数码', '6901234560011', 50, NOW()),
       ('p_002', 'SKU-1002', '氨基酸洗发水', '750ml', '瓶', '日用洗护', '6901234560028', 100, NOW()),
       ('p_003', 'SKU-1003', '原木抽纸', '3 层 * 120 抽', '包', '家庭清洁', '6901234560035', 200, NOW()),
       ('p_004', 'SKU-1004', '缓震运动鞋', '42 码 / 黑色', '双', '鞋服箱包', '6901234560042', 30, NOW()),
       ('p_005', 'SKU-1005', '不锈钢保温杯', '500ml / 银色', '个', '生活用品', '6901234560059', 40, NOW()),
       ('p_006', 'SKU-1006', 'Type-C 数据线', '1.5m / 快充', '条', '电子数码', '6901234560066', 80, NOW());

INSERT IGNORE INTO inventory (id, product_id, location_id, batch_no, qty, updated_at)
VALUES ('inv_1', 'p_001', 'loc_a0101', 'B20261001', 120, NOW()),
       ('inv_2', 'p_002', 'loc_a0102', 'B20261002', 260, NOW()),
       ('inv_3', 'p_003', 'loc_b0101', 'B20261003', 480, NOW()),
       ('inv_4', 'p_004', 'loc_a0201', 'B20261004', 45, NOW()),
       ('inv_5', 'p_005', 'loc_c0101', 'B20261005', 32, NOW()),
       ('inv_6', 'p_006', 'loc_c0102', 'B20261006', 150, NOW());

INSERT IGNORE INTO stock_log (id, type, product_id, location_id, qty, ref_no, remark, created_at)
VALUES ('log_1', 'IN', 'p_001', 'loc_a0101', 120, 'RK20261010-001', '初始入库', NOW() - INTERVAL 120 MINUTE),
       ('log_2', 'IN', 'p_002', 'loc_a0102', 260, 'RK20261010-001', '初始入库', NOW() - INTERVAL 90 MINUTE),
       ('log_3', 'IN', 'p_003', 'loc_b0101', 480, 'RK20261011-001', '初始入库', NOW() - INTERVAL 60 MINUTE),
       ('log_4', 'OUT', 'p_003', 'loc_b0101', 20, 'CK20261011-001', '客户发货', NOW() - INTERVAL 30 MINUTE);

INSERT IGNORE INTO inbound_order (id, no, supplier, warehouse_id, status, remark, created_at, confirmed_at)
VALUES ('in_1', 'RK20261011-001', '华南日化供应链', 'wh_sh01', 'COMPLETED', '常规补货',
        NOW() - INTERVAL 75 MINUTE, NOW() - INTERVAL 60 MINUTE);

INSERT IGNORE INTO inbound_item (id, order_id, product_id, qty, location_id)
VALUES ('in_1_i1', 'in_1', 'p_003', 500, 'loc_b0101'),
       ('in_1_i2', 'in_1', 'p_006', 150, 'loc_c0102');

INSERT IGNORE INTO outbound_order (id, no, customer, warehouse_id, status, remark, created_at, confirmed_at)
VALUES ('out_1', 'CK20261011-001', '天猫旗舰店', 'wh_sh01', 'COMPLETED', '双十一预售',
        NOW() - INTERVAL 40 MINUTE, NOW() - INTERVAL 30 MINUTE);

INSERT IGNORE INTO outbound_item (id, order_id, product_id, qty)
VALUES ('out_1_i1', 'out_1', 'p_003', 20);
