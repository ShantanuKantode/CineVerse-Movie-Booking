package com.bookmyshow.backend.dto;

public record RegisterRequest(String name, String email, String password, String role, String dob) {}
