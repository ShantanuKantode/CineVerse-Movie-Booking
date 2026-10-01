package com.bookmyshow.backend.dto;

import java.util.List;

public record BookingRequest(Long showtimeId, List<String> seats) {}
