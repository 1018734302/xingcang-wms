package com.xingcang.wms.controller;

import com.xingcang.wms.common.ApiException;
import com.xingcang.wms.common.UserInfo;
import com.xingcang.wms.config.TokenStore;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final TokenStore tokenStore;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (!"admin".equals(username) || !"123456".equals(password)) {
            throw new ApiException(401, "用户名或密码错误");
        }
        String token = tokenStore.create(username, "系统管理员");
        return Map.of("token", token, "user", Map.of("username", username, "name", "系统管理员"));
    }

    @GetMapping("/me")
    public Map<String, Object> me(HttpServletRequest request) {
        UserInfo user = (UserInfo) request.getAttribute("currentUser");
        return Map.of("user", Map.of("username", user.getUsername(), "name", user.getName()));
    }
}
