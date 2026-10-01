package com.bookmyshow.backend.controller;

import com.bookmyshow.backend.dto.BookingRequest;
import com.bookmyshow.backend.dto.ShowtimeDetailResponse;
import com.bookmyshow.backend.model.*;
import com.bookmyshow.backend.repository.*;
import com.bookmyshow.backend.service.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final ScreenRepository screenRepository;

    public BookingController(BookingService bookingService, BookingRepository bookingRepository,
                             ShowtimeRepository showtimeRepository, MovieRepository movieRepository,
                             TheaterRepository theaterRepository, ScreenRepository screenRepository) {
        this.bookingService = bookingService;
        this.bookingRepository = bookingRepository;
        this.showtimeRepository = showtimeRepository;
        this.movieRepository = movieRepository;
        this.theaterRepository = theaterRepository;
        this.screenRepository = screenRepository;
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request, HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        String userEmail = (String) httpRequest.getAttribute("userEmail");

        try {
            Booking booking = bookingService.createBooking(
                    request.showtimeId(),
                    request.seats(),
                    userId,
                    userEmail
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(booking);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<?> payBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingService.confirmPayment(id);
            return ResponseEntity.ok(booking);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserBookings(HttpServletRequest httpRequest) {
        Long userId = (Long) httpRequest.getAttribute("userId");
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        
        // Enhance booking list with show and movie details for better display
        List<Map<String, Object>> response = new ArrayList<>();
        for (Booking booking : bookings) {
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
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/showtime/{showtimeId}/booked-seats")
    public List<String> getBookedSeats(@PathVariable Long showtimeId) {
        return bookingService.getBookedSeats(showtimeId);
    }
}
