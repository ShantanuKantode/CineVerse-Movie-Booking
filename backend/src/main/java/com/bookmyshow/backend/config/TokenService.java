package com.bookmyshow.backend.config;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenService {

    public static class SessionDetails {
        private final Long userId;
        private final String email;
        private final String role;

        public SessionDetails(Long userId, String email, String role) {
            this.userId = userId;
            this.email = email;
            this.role = role;
        }

        public Long getUserId() { return userId; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
    }

    private final Map<String, SessionDetails> sessions = new ConcurrentHashMap<>();

    public String generateToken(Long userId, String email, String role) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, new SessionDetails(userId, email, role));
        return token;
    }

    public SessionDetails getSession(String token) {
        if (token == null) return null;
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return sessions.get(token);
    }

    public void removeToken(String token) {
        if (token == null) return;
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        sessions.remove(token);
    }
}
