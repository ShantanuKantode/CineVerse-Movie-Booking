package com.bookmyshow.backend.service;

import com.bookmyshow.backend.model.Booking;
import com.bookmyshow.backend.model.Movie;
import com.bookmyshow.backend.model.Theater;
import com.bookmyshow.backend.model.Showtime;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendTicketEmail(Booking booking, Movie movie, Theater theater, Showtime showtime) {
        String toEmail = booking.getUserEmail();
        String subject = "🎬 Your Ticket Confirmation - " + movie.getTitle();
        
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");
        String formattedDate = showtime.getStartTime().format(dateFormatter);
        String formattedTime = showtime.getStartTime().format(timeFormatter);

        String htmlContent = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);\">" +
                "  <div style=\"background-color: #2b1055; color: white; padding: 20px; text-align: center;\">" +
                "    <h1 style=\"margin: 0; font-size: 24px; letter-spacing: 1px;\">CineVerse</h1>" +
                "    <p style=\"margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;\">Movie Booking Confirmation</p>" +
                "  </div>" +
                "  <div style=\"padding: 25px; background-color: #ffffff;\">" +
                "    <h2 style=\"color: #333; margin-top: 0;\">Enjoy your movie, " + booking.getUserEmail().split("@")[0] + "! 🎉</h2>" +
                "    <p style=\"color: #666; font-size: 15px; line-height: 1.5;\">Your booking has been confirmed. Below is your digital ticket summary. Please present this at the entry counter.</p>" +
                "    " +
                "    <div style=\"background-color: #f9f9f9; border-left: 4px solid #7512fa; padding: 15px; margin: 20px 0; border-radius: 4px;\">" +
                "      <h3 style=\"margin: 0 0 10px 0; color: #2b1055;\">" + movie.getTitle() + "</h3>" +
                "      <table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">" +
                "        <tr>" +
                "          <td style=\"padding: 5px 0; color: #888; width: 100px;\">Theater:</td>" +
                "          <td style=\"padding: 5px 0; color: #333; font-weight: bold;\">" + theater.getName() + " (" + theater.getCity() + ")</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 5px 0; color: #888;\">Address:</td>" +
                "          <td style=\"padding: 5px 0; color: #555;\">" + theater.getAddress() + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 5px 0; color: #888;\">Date:</td>" +
                "          <td style=\"padding: 5px 0; color: #333; font-weight: bold;\">" + formattedDate + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 5px 0; color: #888;\">Time:</td>" +
                "          <td style=\"padding: 5px 0; color: #333; font-weight: bold;\">" + formattedTime + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 5px 0; color: #888;\">Seats:</td>" +
                "          <td style=\"padding: 5px 0; color: #7512fa; font-weight: bold; font-size: 16px;\">" + booking.getSeatNumbers() + "</td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style=\"padding: 5px 0; color: #888;\">Total Paid:</td>" +
                "          <td style=\"padding: 5px 0; color: #333; font-weight: bold;\">₹" + String.format("%.2f", booking.getTotalPrice()) + "</td>" +
                "        </tr>" +
                "      </table>" +
                "    </div>" +
                "    " +
                "    <div style=\"text-align: center; margin: 30px 0 10px 0;\">" +
                "      <p style=\"margin: 0; font-size: 12px; color: #888;\">TICKET CONFIRMATION CODE</p>" +
                "      <p style=\"margin: 5px 0; font-size: 18px; font-weight: bold; color: #333; letter-spacing: 2px;\">" + booking.getTicketCode() + "</p>" +
                "      <div style=\"margin: 15px auto; display: inline-block; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;\">" +
                "        <!-- Mock QR Code Representation -->" +
                "        <div style=\"width: 100px; height: 100px; background-color: #333; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;\">QR CODE</div>" +
                "      </div>" +
                "    </div>" +
                "  </div>" +
                "  <div style=\"background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 11px; color: #777;\">" +
                "    If you have any questions or did not authorize this booking, please contact support." +
                "    <br/>&copy; 2026 CineVerse. All Rights Reserved." +
                "  </div>" +
                "</div>";

        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                mailSender.send(message);
                System.out.println("Email successfully sent to " + toEmail + " using configured JavaMailSender.");
            } catch (Exception e) {
                System.err.println("Failed to send real email via SMTP. Falling back to logging.");
                e.printStackTrace();
                logFallbackTicket(toEmail, subject, movie, theater, formattedDate, formattedTime, booking);
            }
        } else {
            logFallbackTicket(toEmail, subject, movie, theater, formattedDate, formattedTime, booking);
        }
    }

    private void logFallbackTicket(String toEmail, String subject, Movie movie, Theater theater, String date, String time, Booking booking) {
        System.out.println("\n======================================== FALLBACK MAIL LOG ========================================");
        System.out.println("To:      " + toEmail);
        System.out.println("Subject: " + subject);
        System.out.println("Movie:   " + movie.getTitle() + " (" + movie.getLanguage() + " | " + movie.getGenre() + ")");
        System.out.println("Theater: " + theater.getName() + " (" + theater.getCity() + ")");
        System.out.println("Showtime:" + date + " @ " + time);
        System.out.println("Seats:   " + booking.getSeatNumbers());
        System.out.println("Total:   ₹" + booking.getTotalPrice());
        System.out.println("Code:    " + booking.getTicketCode());
        System.out.println("===================================================================================================\n");
    }
}
