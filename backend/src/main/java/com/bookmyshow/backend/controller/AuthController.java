package com.bookmyshow.backend.controller;

import com.bookmyshow.backend.config.HashUtil;
import com.bookmyshow.backend.config.TokenService;
import com.bookmyshow.backend.dto.AuthResponse;
import com.bookmyshow.backend.dto.LoginRequest;
import com.bookmyshow.backend.dto.RegisterRequest;
import com.bookmyshow.backend.model.User;
import com.bookmyshow.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final TokenService tokenService;

    public AuthController(UserRepository userRepository, TokenService tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.email() == null || request.email().trim().isEmpty() ||
            request.password() == null || request.password().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required."));
        }

        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered."));
        }

        String role = (request.role() != null && request.role().equalsIgnoreCase("ADMIN")) ? "ADMIN" : "USER";

        User user = new User(
                request.name() != null ? request.name() : request.email().split("@")[0],
                request.email(),
                HashUtil.hash(request.password()),
                role,
                request.dob()
        );

        User savedUser = userRepository.save(user);
        String token = tokenService.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                token,
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        User user = userOpt.get();
        if (!user.getPassword().equals(HashUtil.hash(request.password()))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        String token = tokenService.generateToken(user.getId(), user.getEmail(), user.getRole());

        return ResponseEntity.ok(new AuthResponse(
                token,
                user.getName(),
                user.getEmail(),
                user.getRole()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null) {
            tokenService.removeToken(authHeader);
        }
        return ResponseEntity.ok(Map.of("message", "Successfully logged out"));
    }
}
