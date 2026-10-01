package com.bookmyshow.backend.repository;

import com.bookmyshow.backend.model.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByMovieId(Long movieId);
    List<Showtime> findByTheaterId(Long theaterId);
    List<Showtime> findByMovieIdAndTheaterId(Long movieId, Long theaterId);
}
