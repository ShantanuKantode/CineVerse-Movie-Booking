package com.bookmyshow.backend.dto;

import java.time.LocalDateTime;

public record AdminShowtimeRequest(
    Long movieId,
    Long theaterId,
    Long screenId,
    LocalDateTime startTime,
    Double price
) {}
