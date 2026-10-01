package com.bookmyshow.backend.service;

import com.bookmyshow.backend.model.*;
import com.bookmyshow.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final EmailService emailService;
    
    // Simple lock map to synchronize seat reservation requests per Showtime ID
    private final Map<Long, Object> showtimeLocks = new ConcurrentHashMap<>();

    public BookingService(BookingRepository bookingRepository, ShowtimeRepository showtimeRepository,
                          MovieRepository movieRepository, TheaterRepository theaterRepository,
                          EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.showtimeRepository = showtimeRepository;
        this.movieRepository = movieRepository;
        this.theaterRepository = theaterRepository;
        this.emailService = emailService;
    }

    private Object getLock(Long showtimeId) {
        return showtimeLocks.computeIfAbsent(showtimeId, k -> new Object());
    }

    public List<String> getBookedSeats(Long showtimeId) {
        List<Booking> bookings = bookingRepository.findByShowtimeId(showtimeId);
        List<String> bookedSeats = new ArrayList<>();
        for (Booking booking : bookings) {
            if ("PAID".equals(booking.getPaymentStatus()) || "PENDING".equals(booking.getPaymentStatus())) {
                String[] seats = booking.getSeatNumbers().split(",");
                bookedSeats.addAll(Arrays.asList(seats));
            }
        }
        return bookedSeats;
    }

    @Transactional
    public Booking createBooking(Long showtimeId, List<String> seatsToBook, Long userId, String userEmail) {
        if (seatsToBook == null || seatsToBook.isEmpty()) {
            throw new IllegalArgumentException("Seat selection cannot be empty.");
        }

        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new NoSuchElementException("Showtime not found."));

        // Synchronize on the showtime ID to prevent race conditions during seat checking
        synchronized (getLock(showtimeId)) {
            List<String> alreadyBooked = getBookedSeats(showtimeId);
            
            for (String seat : seatsToBook) {
                if (alreadyBooked.contains(seat.trim())) {
                    throw new IllegalStateException("Seat " + seat + " is already booked.");
                }
            }

            // Calculate total price with seat modifiers (VIP: +100, Premium: +50)
            double totalPrice = 0;
            double basePrice = showtime.getPrice();
            for (String seat : seatsToBook) {
                if (seat == null || seat.trim().isEmpty()) {
                    continue;
                }
                char row = Character.toUpperCase(seat.trim().charAt(0));
                if (row == 'A' || row == 'B') {
                    totalPrice += basePrice + 100.0;
                } else if (row == 'C' || row == 'D' || row == 'E') {
                    totalPrice += basePrice + 50.0;
                } else {
                    totalPrice += basePrice;
                }
            }
            String seatNumbersStr = String.join(",", seatsToBook);

            Booking booking = new Booking();
            booking.setShowtimeId(showtimeId);
            booking.setUserId(userId);
            booking.setSeatNumbers(seatNumbersStr);
            booking.setTotalPrice(totalPrice);
            booking.setBookingTime(LocalDateTime.now());
            booking.setPaymentStatus("PENDING");
            booking.setTicketCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            booking.setUserEmail(userEmail);

            return bookingRepository.save(booking);
        }
    }

    @Transactional
    public Booking confirmPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NoSuchElementException("Booking not found."));

        if ("PAID".equals(booking.getPaymentStatus())) {
            return booking;
        }

        booking.setPaymentStatus("PAID");
        Booking savedBooking = bookingRepository.save(booking);

        // Fetch details to send email
        Showtime showtime = showtimeRepository.findById(booking.getShowtimeId())
                .orElseThrow(() -> new NoSuchElementException("Showtime not found for booking."));
        Movie movie = movieRepository.findById(showtime.getMovieId())
                .orElseThrow(() -> new NoSuchElementException("Movie not found."));
        Theater theater = theaterRepository.findById(showtime.getTheaterId())
                .orElseThrow(() -> new NoSuchElementException("Theater not found."));

        // Trigger email notification asynchronously or directly
        try {
            emailService.sendTicketEmail(savedBooking, movie, theater, showtime);
        } catch (Exception e) {
            System.err.println("Email dispatch failed, but booking was saved: " + e.getMessage());
        }

        return savedBooking;
    }
}
