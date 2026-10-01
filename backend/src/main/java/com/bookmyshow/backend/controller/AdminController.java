package com.bookmyshow.backend.controller;

import com.bookmyshow.backend.dto.AdminShowtimeRequest;
import com.bookmyshow.backend.model.*;
import com.bookmyshow.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final ScreenRepository screenRepository;
    private final ShowtimeRepository showtimeRepository;
    private final BookingRepository bookingRepository;

    public AdminController(MovieRepository movieRepository, TheaterRepository theaterRepository,
                           ScreenRepository screenRepository, ShowtimeRepository showtimeRepository,
                           BookingRepository bookingRepository) {
        this.movieRepository = movieRepository;
        this.theaterRepository = theaterRepository;
        this.screenRepository = screenRepository;
        this.showtimeRepository = showtimeRepository;
        this.bookingRepository = bookingRepository;
    }

    // --- Dashboard Stats ---
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats() {
        List<Booking> bookings = bookingRepository.findAll();
        long activeMovies = movieRepository.count();
        long activeTheaters = theaterRepository.count();
        long activeShows = showtimeRepository.count();

        double totalRevenue = 0;
        long ticketsSold = 0;
        List<Map<String, Object>> bookingsDetailList = new ArrayList<>();

        for (Booking booking : bookings) {
            if ("PAID".equals(booking.getPaymentStatus())) {
                totalRevenue += booking.getTotalPrice();
                // Count number of seats
                if (booking.getSeatNumbers() != null && !booking.getSeatNumbers().isEmpty()) {
                    ticketsSold += booking.getSeatNumbers().split(",").length;
                }
            }

            Map<String, Object> map = new HashMap<>();
            map.put("booking", booking);

            Showtime showtime = showtimeRepository.findById(booking.getShowtimeId()).orElse(null);
            if (showtime != null) {
                Movie movie = movieRepository.findById(showtime.getMovieId()).orElse(null);
                Theater theater = theaterRepository.findById(showtime.getTheaterId()).orElse(null);
                Screen screen = screenRepository.findById(showtime.getScreenId()).orElse(null);
                
                map.put("movie", movie);
                map.put("theater", theater);
                map.put("screen", screen);
                map.put("showtime", showtime);
            }
            bookingsDetailList.add(map);
        }

        // Sort bookings by time descending
        bookingsDetailList.sort((a, b) -> {
            Booking b1 = (Booking) a.get("booking");
            Booking b2 = (Booking) b.get("booking");
            return b2.getBookingTime().compareTo(b1.getBookingTime());
        });

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("ticketsSold", ticketsSold);
        stats.put("activeMovies", activeMovies);
        stats.put("activeTheaters", activeTheaters);
        stats.put("activeShows", activeShows);
        stats.put("bookings", bookingsDetailList);

        return ResponseEntity.ok(stats);
    }

    // --- Movie Management ---
    @PostMapping("/movies")
    public ResponseEntity<Movie> addMovie(@RequestBody Movie movie) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movieRepository.save(movie));
    }

    @PutMapping("/movies/{id}")
    public ResponseEntity<Movie> updateMovie(@PathVariable Long id, @RequestBody Movie movieDetails) {
        return movieRepository.findById(id).map(movie -> {
            movie.setTitle(movieDetails.getTitle());
            movie.setDescription(movieDetails.getDescription());
            movie.setDuration(movieDetails.getDuration());
            movie.setGenre(movieDetails.getGenre());
            movie.setLanguage(movieDetails.getLanguage());
            movie.setReleaseDate(movieDetails.getReleaseDate());
            movie.setPosterUrl(movieDetails.getPosterUrl());
            movie.setRating(movieDetails.getRating());
            return ResponseEntity.ok(movieRepository.save(movie));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<?> deleteMovie(@PathVariable Long id) {
        return movieRepository.findById(id).map(movie -> {
            // Delete associated showtimes
            List<Showtime> shows = showtimeRepository.findByMovieId(id);
            showtimeRepository.deleteAll(shows);
            movieRepository.delete(movie);
            return ResponseEntity.ok(Map.of("message", "Movie deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Theater Management ---
    @PostMapping("/theaters")
    public ResponseEntity<Theater> addTheater(@RequestBody Theater theater) {
        return ResponseEntity.status(HttpStatus.CREATED).body(theaterRepository.save(theater));
    }

    @DeleteMapping("/theaters/{id}")
    public ResponseEntity<?> deleteTheater(@PathVariable Long id) {
        return theaterRepository.findById(id).map(theater -> {
            // Delete associated screens and shows
            List<Screen> screens = screenRepository.findByTheaterId(id);
            screenRepository.deleteAll(screens);
            List<Showtime> shows = showtimeRepository.findByTheaterId(id);
            showtimeRepository.deleteAll(shows);
            
            theaterRepository.delete(theater);
            return ResponseEntity.ok(Map.of("message", "Theater deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Screen Management ---
    @PostMapping("/screens")
    public ResponseEntity<Screen> addScreen(@RequestBody Screen screen) {
        return ResponseEntity.status(HttpStatus.CREATED).body(screenRepository.save(screen));
    }

    @DeleteMapping("/screens/{id}")
    public ResponseEntity<?> deleteScreen(@PathVariable Long id) {
        return screenRepository.findById(id).map(screen -> {
            screenRepository.delete(screen);
            return ResponseEntity.ok(Map.of("message", "Screen deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Showtime Management ---
    @PostMapping("/showtimes")
    public ResponseEntity<?> addShowtime(@RequestBody AdminShowtimeRequest request) {
        if (request.movieId() == null || request.theaterId() == null ||
            request.screenId() == null || request.startTime() == null || request.price() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required."));
        }

        Movie movie = movieRepository.findById(request.movieId()).orElse(null);
        if (movie == null) return ResponseEntity.badRequest().body(Map.of("error", "Movie not found."));

        Theater theater = theaterRepository.findById(request.theaterId()).orElse(null);
        if (theater == null) return ResponseEntity.badRequest().body(Map.of("error", "Theater not found."));

        Screen screen = screenRepository.findById(request.screenId()).orElse(null);
        if (screen == null) return ResponseEntity.badRequest().body(Map.of("error", "Screen not found."));

        // Calculate end time based on movie duration (+ 30 mins cleaning break)
        int duration = movie.getDuration() != null ? movie.getDuration() : 120;
        LocalDateTime endTime = request.startTime().plusMinutes(duration + 30);

        Showtime showtime = new Showtime(
                request.movieId(),
                request.theaterId(),
                request.screenId(),
                request.startTime(),
                endTime,
                request.price()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(showtimeRepository.save(showtime));
    }

    @DeleteMapping("/showtimes/{id}")
    public ResponseEntity<?> deleteShowtime(@PathVariable Long id) {
        return showtimeRepository.findById(id).map(showtime -> {
            showtimeRepository.delete(showtime);
            return ResponseEntity.ok(Map.of("message", "Showtime deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/showtimes/{id}/empty-seats")
    public ResponseEntity<?> emptySeats(@PathVariable Long id) {
        return showtimeRepository.findById(id).map(showtime -> {
            List<Booking> bookings = bookingRepository.findByShowtimeId(id);
            bookingRepository.deleteAll(bookings);
            return ResponseEntity.ok(Map.of("message", "All seats for this showtime are now empty."));
        }).orElse(ResponseEntity.notFound().build());
    }
}
