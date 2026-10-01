package com.bookmyshow.backend.controller;

import com.bookmyshow.backend.dto.ShowtimeDetailResponse;
import com.bookmyshow.backend.model.Movie;
import com.bookmyshow.backend.model.Screen;
import com.bookmyshow.backend.model.Showtime;
import com.bookmyshow.backend.model.Theater;
import com.bookmyshow.backend.repository.MovieRepository;
import com.bookmyshow.backend.repository.ScreenRepository;
import com.bookmyshow.backend.repository.ShowtimeRepository;
import com.bookmyshow.backend.repository.TheaterRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieRepository movieRepository;
    private final ShowtimeRepository showtimeRepository;
    private final TheaterRepository theaterRepository;
    private final ScreenRepository screenRepository;

    public MovieController(MovieRepository movieRepository, ShowtimeRepository showtimeRepository,
                           TheaterRepository theaterRepository, ScreenRepository screenRepository) {
        this.movieRepository = movieRepository;
        this.showtimeRepository = showtimeRepository;
        this.theaterRepository = theaterRepository;
        this.screenRepository = screenRepository;
    }

    @GetMapping
    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable Long id) {
        return movieRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/shows")
    public ResponseEntity<List<ShowtimeDetailResponse>> getShowsByMovie(@PathVariable Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Movie not found"));

        List<Showtime> showtimes = showtimeRepository.findByMovieId(id);
        List<ShowtimeDetailResponse> detailsList = new ArrayList<>();

        for (Showtime showtime : showtimes) {
            Theater theater = theaterRepository.findById(showtime.getTheaterId()).orElse(null);
            Screen screen = screenRepository.findById(showtime.getScreenId()).orElse(null);
            
            detailsList.add(new ShowtimeDetailResponse(
                    showtime.getId(),
                    movie,
                    theater,
                    screen,
                    showtime.getStartTime(),
                    showtime.getEndTime(),
                    showtime.getPrice()
            ));
        }

        return ResponseEntity.ok(detailsList);
    }
}
