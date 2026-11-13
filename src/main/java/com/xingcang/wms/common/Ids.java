package com.xingcang.wms.common;

import java.util.UUID;

public final class Ids {

    private Ids() {
    }

    public static String gen(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
