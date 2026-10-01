package com.bookmyshow.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long showtimeId;
    private Long userId;
    
    private String seatNumbers; // e.g. "A1,A2"
    private Double totalPrice;
    private LocalDateTime bookingTime;
    
    private String paymentStatus; // "PENDING", "PAID", "FAILED"
    
    @Column(unique = true)
    private String ticketCode; // UUID
    
    private String userEmail;

    public Booking() {}

    public Booking(Long showtimeId, Long userId, String seatNumbers, Double totalPrice, LocalDateTime bookingTime, String paymentStatus, String ticketCode, String userEmail) {
        this.showtimeId = showtimeId;
        this.userId = userId;
        this.seatNumbers = seatNumbers;
        this.totalPrice = totalPrice;
        this.bookingTime = bookingTime;
        this.paymentStatus = paymentStatus;
        this.ticketCode = ticketCode;
        this.userEmail = userEmail;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getShowtimeId() {
        return showtimeId;
    }

    public void setShowtimeId(Long showtimeId) {
        this.showtimeId = showtimeId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSeatNumbers() {
        return seatNumbers;
    }

    public void setSeatNumbers(String seatNumbers) {
        this.seatNumbers = seatNumbers;
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public LocalDateTime getBookingTime() {
        return bookingTime;
    }

    public void setBookingTime(LocalDateTime bookingTime) {
        this.bookingTime = bookingTime;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getTicketCode() {
        return ticketCode;
    }

    public void setTicketCode(String ticketCode) {
        this.ticketCode = ticketCode;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
}
