package com.xingcang.wms.config;

import com.xingcang.wms.common.UserInfo;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenStore {

    private final Map<String, UserInfo> tokens = new ConcurrentHashMap<>();

    public String create(String username, String name) {
        String token = UUID.randomUUID().toString().replace("-", "");
        tokens.put(token, new UserInfo(username, name));
        return token;
    }

    public UserInfo get(String token) {
        return token == null ? null : tokens.get(token);
    }
}
