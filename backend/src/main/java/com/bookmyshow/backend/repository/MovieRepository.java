package com.bookmyshow.backend.repository;

import com.bookmyshow.backend.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieRepository extends JpaRepository<Movie, Long> {
}
