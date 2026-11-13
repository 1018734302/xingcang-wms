CREATE TABLE IF NOT EXISTS product (
    id           VARCHAR(40)  NOT NULL PRIMARY KEY,
    code         VARCHAR(64)  NOT NULL,
    name         VARCHAR(128) NOT NULL,
    spec         VARCHAR(128) DEFAULT '',
    unit         VARCHAR(16)  DEFAULT '个',
    category     VARCHAR(64)  DEFAULT '未分类',
    barcode      VARCHAR(64)  DEFAULT '',
    safety_stock INT          DEFAULT 0,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_product_code (code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS warehouse (
    id         VARCHAR(40)  NOT NULL PRIMARY KEY,
    code       VARCHAR(64)  NOT NULL,
    name       VARCHAR(128) NOT NULL,
    address    VARCHAR(255) DEFAULT '',
    manager    VARCHAR(64)  DEFAULT '',
    phone      VARCHAR(32)  DEFAULT '',
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_warehouse_code (code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS location (
    id           VARCHAR(40) NOT NULL PRIMARY KEY,
    warehouse_id VARCHAR(40) NOT NULL,
    code         VARCHAR(64) NOT NULL,
    zone         VARCHAR(16) DEFAULT 'A',
    capacity     INT         DEFAULT 100,
    status       VARCHAR(16) DEFAULT 'ENABLED',
    UNIQUE KEY uk_location (warehouse_id, code),
    KEY idx_location_wh (warehouse_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS inventory (
    id          VARCHAR(40) NOT NULL PRIMARY KEY,
    product_id  VARCHAR(40) NOT NULL,
    location_id VARCHAR(40) NOT NULL,
    batch_no    VARCHAR(64) DEFAULT 'DEFAULT',
    qty         INT         NOT NULL DEFAULT 0,
    updated_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_inventory (product_id, location_id, batch_no),
    KEY idx_inventory_product (product_id),
    KEY idx_inventory_location (location_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS stock_log (
    id          VARCHAR(40) NOT NULL PRIMARY KEY,
    type        VARCHAR(8)  NOT NULL,
    product_id  VARCHAR(40) NOT NULL,
    location_id VARCHAR(40),
    qty         INT         NOT NULL,
    ref_no      VARCHAR(64),
    remark      VARCHAR(255),
    created_at  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    KEY idx_log_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS inbound_order (
    id           VARCHAR(40)  NOT NULL PRIMARY KEY,
    no           VARCHAR(64)  NOT NULL,
    supplier     VARCHAR(128),
    warehouse_id VARCHAR(40)  NOT NULL,
    status       VARCHAR(16)  NOT NULL,
    remark       VARCHAR(255),
    created_at   DATETIME,
    confirmed_at DATETIME NULL,
    UNIQUE KEY uk_inbound_no (no)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS inbound_item (
    id          VARCHAR(40) NOT NULL PRIMARY KEY,
    order_id    VARCHAR(40) NOT NULL,
    product_id  VARCHAR(40) NOT NULL,
    qty         INT         NOT NULL,
    location_id VARCHAR(40) NOT NULL,
    KEY idx_inbound_item_order (order_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS outbound_order (
    id           VARCHAR(40)  NOT NULL PRIMARY KEY,
    no           VARCHAR(64)  NOT NULL,
    customer     VARCHAR(128),
    warehouse_id VARCHAR(40)  NOT NULL,
    status       VARCHAR(16)  NOT NULL,
    remark       VARCHAR(255),
    created_at   DATETIME,
    confirmed_at DATETIME NULL,
    UNIQUE KEY uk_outbound_no (no)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS outbound_item (
    id         VARCHAR(40) NOT NULL PRIMARY KEY,
    order_id   VARCHAR(40) NOT NULL,
    product_id VARCHAR(40) NOT NULL,
    qty        INT         NOT NULL,
    KEY idx_outbound_item_order (order_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS order_seq (
    seq_key VARCHAR(64) NOT NULL PRIMARY KEY,
    val     INT         NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
