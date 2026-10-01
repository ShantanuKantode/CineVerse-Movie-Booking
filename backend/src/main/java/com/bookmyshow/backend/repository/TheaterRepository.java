package com.bookmyshow.backend.repository;

import com.bookmyshow.backend.model.Theater;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TheaterRepository extends JpaRepository<Theater, Long> {
    List<Theater> findByCityIgnoreCase(String city);
}
