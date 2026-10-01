package com.bookmyshow.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;

    public AuthInterceptor(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();

        // Allow preflight CORS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // Check if path is secure
        boolean requiresUser = uri.startsWith("/api/bookings");
        boolean requiresAdmin = uri.startsWith("/api/admin");

        if (!requiresUser && !requiresAdmin) {
            return true; // Public endpoint
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || authHeader.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Unauthorized: Missing authentication token\"}");
            return false;
        }

        TokenService.SessionDetails session = tokenService.getSession(authHeader);
        if (session == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Unauthorized: Invalid or expired token\"}");
            return false;
        }

        // Attach session details to request for controller access
        request.setAttribute("userId", session.getUserId());
        request.setAttribute("userEmail", session.getEmail());
        request.setAttribute("userRole", session.getRole());

        // Check Admin privilege
        if (requiresAdmin && !"ADMIN".equalsIgnoreCase(session.getRole())) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"error\": \"Forbidden: Admin access required\"}");
            return false;
        }

        return true;
    }
}
