package com.bookmyshow.backend.dto;

import com.bookmyshow.backend.model.Movie;
import com.bookmyshow.backend.model.Theater;
import com.bookmyshow.backend.model.Screen;
import java.time.LocalDateTime;

public record ShowtimeDetailResponse(
    Long id,
    Movie movie,
    Theater theater,
    Screen screen,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Double price
) {}
