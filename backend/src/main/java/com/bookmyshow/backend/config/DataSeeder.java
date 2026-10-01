package com.bookmyshow.backend.config;

import com.bookmyshow.backend.model.*;
import com.bookmyshow.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final TheaterRepository theaterRepository;
    private final ScreenRepository screenRepository;
    private final ShowtimeRepository showtimeRepository;

    public DataSeeder(UserRepository userRepository, MovieRepository movieRepository,
                      TheaterRepository theaterRepository, ScreenRepository screenRepository,
                      ShowtimeRepository showtimeRepository) {
        this.userRepository = userRepository;
        this.movieRepository = movieRepository;
        this.theaterRepository = theaterRepository;
        this.screenRepository = screenRepository;
        this.showtimeRepository = showtimeRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Delete old default admin if present
        userRepository.findByEmail("admin@cineverse.com").ifPresent(userRepository::delete);

        // Ensure the new custom admin exists and has correct password
        Optional<User> adminOpt = userRepository.findByEmail("cineversebyrudra@gmail.com");
        if (adminOpt.isEmpty()) {
            User admin = new User("System Admin", "cineversebyrudra@gmail.com", HashUtil.hash("cineverse2004"), "ADMIN", "1990-01-01");
            userRepository.save(admin);
        } else {
            User admin = adminOpt.get();
            admin.setPassword(HashUtil.hash("cineverse2004"));
            userRepository.save(admin);
        }

        // Ensure the default user exists
        if (userRepository.findByEmail("user@gmail.com").isEmpty()) {
            User user = new User("John Doe", "user@gmail.com", HashUtil.hash("user123"), "USER", "1995-05-15");
            userRepository.save(user);
        }

        // Only seed movies, theaters, etc. if empty
        if (movieRepository.count() > 0) {
            return;
        }

        // 2. Seed Movies
        Movie m1 = new Movie(
                "Oppenheimer",
                "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
                180,
                "Biography, Drama, History",
                "English",
                "2023-07-21",
                "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600",
                8.6
        );

        Movie m2 = new Movie(
                "Barbie",
                "Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.",
                114,
                "Adventure, Comedy, Fantasy",
                "English",
                "2023-07-21",
                "https://images.unsplash.com/photo-1594744803329-e58b31de215f?q=80&w=600",
                7.2
        );

        Movie m3 = new Movie(
                "Spider-Man: Across the Spider-Verse",
                "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.",
                140,
                "Animation, Action, Adventure",
                "English",
                "2023-06-02",
                "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600",
                8.9
        );

        Movie m4 = new Movie(
                "Interstellar",
                "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival in this mind-bending sci-fi epic.",
                169,
                "Sci-Fi, Adventure, Drama",
                "English",
                "2014-11-07",
                "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600",
                8.7
        );

        movieRepository.save(m1);
        movieRepository.save(m2);
        movieRepository.save(m3);
        movieRepository.save(m4);

        // 3. Seed Theaters
        Theater t1 = new Theater("PVR Director's Cut", "Delhi", "Ambience Mall, Vasant Kunj, New Delhi");
        Theater t2 = new Theater("Inox Lido Mall", "Bengaluru", "Lido Mall, Trinity Circle, Bengaluru");
        Theater t3 = new Theater("IMAX Wadala", "Mumbai", "Bhakti Park, Wadala, Mumbai");

        theaterRepository.save(t1);
        theaterRepository.save(t2);
        theaterRepository.save(t3);

        // 4. Seed Screens
        List<Screen> screens = new ArrayList<>();
        // Delhi Screens
        screens.add(new Screen(t1.getId(), "Screen 1 (Gold)", 96));
        screens.add(new Screen(t1.getId(), "Screen 2", 96));
        // Bengaluru Screens
        screens.add(new Screen(t2.getId(), "Screen 1", 96));
        screens.add(new Screen(t2.getId(), "IMAX Screen", 96));
        // Mumbai Screens
        screens.add(new Screen(t3.getId(), "IMAX Screen 1", 96));
        screens.add(new Screen(t3.getId(), "Screen 2", 96));

        screenRepository.saveAll(screens);

        // Fetch saved screens to get IDs
        Screen t1s1 = screens.get(0);
        Screen t1s2 = screens.get(1);
        Screen t2s1 = screens.get(2);
        Screen t2s2 = screens.get(3);
        Screen t3s1 = screens.get(4);
        Screen t3s2 = screens.get(5);

        // 5. Seed Showtimes
        LocalDateTime now = LocalDateTime.now();

        // Oppenheimer Shows (today and tomorrow)
        showtimeRepository.save(new Showtime(m1.getId(), t1.getId(), t1s1.getId(), now.withHour(14).withMinute(0).withSecond(0), now.withHour(17).withMinute(0).withSecond(0), 250.00));
        showtimeRepository.save(new Showtime(m1.getId(), t3.getId(), t3s1.getId(), now.withHour(18).withMinute(30).withSecond(0), now.withHour(21).withMinute(30).withSecond(0), 350.00));
        showtimeRepository.save(new Showtime(m1.getId(), t2.getId(), t2s2.getId(), now.plusDays(1).withHour(11).withMinute(0).withSecond(0), now.plusDays(1).withHour(14).withMinute(0).withSecond(0), 200.00));

        // Barbie Shows (today and tomorrow)
        showtimeRepository.save(new Showtime(m2.getId(), t1.getId(), t1s2.getId(), now.withHour(16).withMinute(0).withSecond(0), now.withHour(18).withMinute(0).withSecond(0), 180.00));
        showtimeRepository.save(new Showtime(m2.getId(), t2.getId(), t2s1.getId(), now.withHour(20).withMinute(15).withSecond(0), now.withHour(22).withMinute(15).withSecond(0), 220.00));
        showtimeRepository.save(new Showtime(m2.getId(), t3.getId(), t3s2.getId(), now.plusDays(1).withHour(14).withMinute(30).withSecond(0), now.plusDays(1).withHour(16).withMinute(30).withSecond(0), 180.00));

        // Spider-Man Shows
        showtimeRepository.save(new Showtime(m3.getId(), t2.getId(), t2s2.getId(), now.withHour(15).withMinute(30).withSecond(0), now.withHour(18).withMinute(0).withSecond(0), 240.00));
        showtimeRepository.save(new Showtime(m3.getId(), t3.getId(), t3s1.getId(), now.withHour(11).withMinute(0).withSecond(0), now.withHour(13).withMinute(30).withSecond(0), 290.00));

        // Interstellar Shows
        showtimeRepository.save(new Showtime(m4.getId(), t3.getId(), t3s1.getId(), now.plusDays(1).withHour(20).withMinute(0).withSecond(0), now.plusDays(1).withHour(23).withMinute(0).withSecond(0), 260.00));
        showtimeRepository.save(new Showtime(m4.getId(), t1.getId(), t1s1.getId(), now.withHour(19).withMinute(0).withSecond(0), now.withHour(22).withMinute(0).withSecond(0), 250.00));

        System.out.println("Data seeding complete! Logins: admin@cineverse.com (admin123) | user@gmail.com (user123)");
    }
}
