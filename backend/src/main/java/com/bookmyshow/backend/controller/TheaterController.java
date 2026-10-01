package com.bookmyshow.backend.controller;

import com.bookmyshow.backend.model.Theater;
import com.bookmyshow.backend.model.Screen;
import com.bookmyshow.backend.repository.TheaterRepository;
import com.bookmyshow.backend.repository.ScreenRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/theaters")
public class TheaterController {

    private final TheaterRepository theaterRepository;
    private final ScreenRepository screenRepository;

    public TheaterController(TheaterRepository theaterRepository, ScreenRepository screenRepository) {
        this.theaterRepository = theaterRepository;
        this.screenRepository = screenRepository;
    }

    @GetMapping
    public List<Theater> getTheaters(@RequestParam(value = "city", required = false) String city) {
        if (city != null && !city.trim().isEmpty()) {
            return theaterRepository.findByCityIgnoreCase(city);
        }
        return theaterRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Theater> getTheaterById(@PathVariable Long id) {
        return theaterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/screens")
    public List<Screen> getScreensByTheater(@PathVariable Long id) {
        return screenRepository.findByTheaterId(id);
    }
}
