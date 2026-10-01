import React, { useState, useEffect } from 'react';

const API_BASE = window.location.origin.includes('localhost') 
  ? 'http://localhost:8080/api' 
  : '/api';

export default function App() {
  // Navigation & Router
  const [currentView, setCurrentView] = useState('landing'); // landing, movie-detail, seat-select, payment, ticket-success, bookings-history, admin-dashboard, auth
  const [authTab, setAuthTab] = useState('login'); // login, register
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(null);

  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // Core Data Lists
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [cities, setCities] = useState(() => {
    const saved = localStorage.getItem('cineverse_cities');
    return saved ? JSON.parse(saved) : ['All', 'Delhi', 'Bengaluru', 'Mumbai'];
  });
  const [isAddingNewCity, setIsAddingNewCity] = useState(false);
  const [customCityName, setCustomCityName] = useState('');
  
  // Selection States for Booking
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieShows, setMovieShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeatsForShow, setBookedSeatsForShow] = useState([]);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Filter States
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication Forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('USER'); // USER or ADMIN
  const [regDob, setRegDob] = useState('');

  // Payment Form (Mock)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // User History
  const [userBookings, setUserBookings] = useState([]);

  // Admin Dashboard Data
  const [adminTab, setAdminTab] = useState('overview'); // overview, movies, theaters, shows, bookings
  const [adminStats, setAdminStats] = useState({
    totalRevenue: 0,
    ticketsSold: 0,
    activeMovies: 0,
    activeTheaters: 0,
    activeShows: 0,
    bookings: []
  });

  // Admin Edit Forms
  const [newMovie, setNewMovie] = useState({ title: '', description: '', duration: 120, genre: '', language: 'English', releaseDate: '', posterUrl: '', rating: 8.0 });
  const [newTheater, setNewTheater] = useState({ name: '', city: 'Delhi', address: '' });
  const [newScreen, setNewScreen] = useState({ theaterId: '', name: 'Screen 1', totalSeats: 96 });
  const [newShowtime, setNewShowtime] = useState({ movieId: '', theaterId: '', screenId: '', startTime: '', price: 10.0 });

  // Notifications
  const [alert, setAlert] = useState(null);

  // API Call Wrapper
  const apiFetch = async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    
    try {
      const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      triggerAlert(err.message, 'danger');
      throw err;
    }
  };

  const triggerAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Helper to add a new city
  const addCity = (newCity) => {
    if (!newCity) return;
    const cleanCity = newCity.trim();
    setCities(prev => {
      if (!prev.includes(cleanCity)) {
        const updated = [...prev, cleanCity];
        localStorage.setItem('cineverse_cities', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // Fetch initial movies & list data
  const loadInitialData = async () => {
    try {
      const moviesData = await apiFetch('/movies');
      setMovies(moviesData);
      const theatersData = await apiFetch('/theaters');
      setTheaters(theatersData);
      
      // Auto-extract and sync cities from theaters list to prevent data loss
      setCities(prev => {
        const dbCities = theatersData.map(t => t.city);
        const merged = [...new Set([...prev, ...dbCities])];
        localStorage.setItem('cineverse_cities', JSON.stringify(merged));
        return merged;
      });
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Sync session with local storage
  const handleAuthSuccess = (authData) => {
    setUser(authData);
    setToken(authData.token);
    localStorage.setItem('user', JSON.stringify(authData));
    localStorage.setItem('token', authData.token);
    triggerAlert(`Welcome back, ${authData.name}!`);
    
    if (redirectAfterAuth) {
      setCurrentView(redirectAfterAuth.view);
      if (redirectAfterAuth.callback) redirectAfterAuth.callback();
      setRedirectAfterAuth(null);
    } else {
      setCurrentView(authData.role === 'ADMIN' ? 'admin-dashboard' : 'landing');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setCurrentView('landing');
    triggerAlert('Logged out successfully.');
  };

  // Fetch Admin Stats
  const loadAdminStats = async () => {
    if (user?.role !== 'ADMIN') return;
    try {
      const stats = await apiFetch('/admin/dashboard');
      setAdminStats(stats);
    } catch (err) {
      console.error("Failed to load admin stats", err);
    }
  };

  useEffect(() => {
    if (currentView === 'admin-dashboard') {
      loadAdminStats();
    }
  }, [currentView, adminTab]);

  // Load User Bookings
  const loadUserBookings = async () => {
    if (!user) return;
    try {
      const history = await apiFetch('/bookings/user');
      setUserBookings(history);
    } catch (err) {
      console.error("Failed to load bookings", err);
    }
  };

  useEffect(() => {
    if (currentView === 'bookings-history') {
      loadUserBookings();
    }
  }, [currentView]);

  // Handle Authentication Forms
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      handleAuthSuccess(data);
      // Reset form
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      // Handled by apiFetch
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, role: regRole, dob: regDob })
      });
      handleAuthSuccess(data);
      // Reset form
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegDob('');
    } catch (err) {
      // Handled by apiFetch
    }
  };

  // Movie Details Click
  const handleMovieSelect = async (movie) => {
    setSelectedMovie(movie);
    setCurrentView('movie-detail');
    try {
      const shows = await apiFetch(`/movies/${movie.id}/shows`);
      setMovieShows(shows);
    } catch (err) {
      console.error(err);
    }
  };

  // Showtime selection
  const handleShowtimeSelect = async (show) => {
    setSelectedShow(show);
    setSelectedSeats([]);
    setCurrentView('seat-select');
    try {
      const occupied = await apiFetch(`/bookings/showtime/${show.id}/booked-seats`);
      setBookedSeatsForShow(occupied);
    } catch (err) {
      console.error(err);
    }
  };

  // Seat toggle
  const toggleSeat = (seatId) => {
    if (bookedSeatsForShow.includes(seatId)) return;
    setSelectedSeats(prev => 
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  // Proceed to checkout
  const handleBookSeatsSubmit = async () => {
    if (selectedSeats.length === 0) {
      triggerAlert('Please select at least one seat.', 'danger');
      return;
    }

    if (!user) {
      setRedirectAfterAuth({
        view: 'seat-select',
        callback: () => handleBookSeatsSubmit()
      });
      setCurrentView('auth');
      triggerAlert('Please sign in to proceed with booking.', 'info');
      return;
    }

    try {
      const booking = await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          showtimeId: selectedShow.id,
          seats: selectedSeats
        })
      });
      setCreatedBooking(booking);
      // Reset credit card inputs
      setCardNumber('');
      setCardExpiry('');
      setCardCVV('');
      setCurrentView('payment');
    } catch (err) {
      // Refresh booked seats if someone else booked them
      const occupied = await apiFetch(`/bookings/showtime/${selectedShow.id}/booked-seats`);
      setBookedSeatsForShow(occupied);
      setSelectedSeats([]);
    }
  };

  // Mock Payment submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCVV) {
      triggerAlert('Please fill in all credit card details.', 'danger');
      return;
    }

    setPaymentProcessing(true);
    // Simulate payment transaction
    setTimeout(async () => {
      try {
        const confirmedBooking = await apiFetch(`/bookings/${createdBooking.id}/pay`, {
          method: 'POST'
        });
        setCreatedBooking(confirmedBooking);
        setPaymentProcessing(false);
        setCurrentView('ticket-success');
        triggerAlert('Tickets booked successfully! A receipt has been sent to your email.');
      } catch (err) {
        setPaymentProcessing(false);
      }
    }, 2000);
  };

  // --- ADMIN ACTIONS ---
  // Movie Add
  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/movies', {
        method: 'POST',
        body: JSON.stringify(newMovie)
      });
      triggerAlert('Movie added successfully.');
      loadInitialData();
      setNewMovie({ title: '', description: '', duration: 120, genre: '', language: 'English', releaseDate: '', posterUrl: '', rating: 8.0 });
    } catch (err) {}
  };

  const handleDeleteMovie = async (id) => {
    if (!confirm('Are you sure you want to delete this movie? This will also remove all scheduled shows.')) return;
    try {
      await apiFetch(`/admin/movies/${id}`, { method: 'DELETE' });
      triggerAlert('Movie deleted successfully.');
      loadInitialData();
      loadAdminStats();
    } catch (err) {}
  };

  // Theater Add
  const handleAddTheater = async (e) => {
    e.preventDefault();
    try {
      let finalCity = newTheater.city;
      if (isAddingNewCity) {
        if (!customCityName.trim()) {
          triggerAlert('Please enter a city name.', 'danger');
          return;
        }
        finalCity = customCityName.trim();
        addCity(finalCity);
      }
      
      await apiFetch('/admin/theaters', {
        method: 'POST',
        body: JSON.stringify({ ...newTheater, city: finalCity })
      });
      triggerAlert('Theater added successfully.');
      loadInitialData();
      setIsAddingNewCity(false);
      setCustomCityName('');
      setNewTheater({ name: '', city: finalCity, address: '' });
    } catch (err) {}
  };

  const handleDeleteTheater = async (id) => {
    if (!confirm('Are you sure you want to delete this theater? This will remove all associated screens and shows.')) return;
    try {
      await apiFetch(`/admin/theaters/${id}`, { method: 'DELETE' });
      triggerAlert('Theater deleted successfully.');
      loadInitialData();
      loadAdminStats();
    } catch (err) {}
  };

  // Screen Add
  const handleAddScreen = async (e) => {
    e.preventDefault();
    if (!newScreen.theaterId) {
      triggerAlert('Please select a theater.', 'danger');
      return;
    }
    try {
      await apiFetch('/admin/screens', {
        method: 'POST',
        body: JSON.stringify({
          ...newScreen,
          theaterId: Number(newScreen.theaterId)
        })
      });
      triggerAlert('Screen added successfully.');
      setNewScreen({ theaterId: '', name: 'Screen 1', totalSeats: 96 });
    } catch (err) {}
  };

  // Fetch screens dynamically when theater selection changes in forms
  const loadScreensForTheater = async (theaterId) => {
    if (!theaterId) {
      setScreens([]);
      return;
    }
    try {
      const screensData = await apiFetch(`/theaters/${theaterId}/screens`);
      setScreens(screensData);
    } catch (err) {
      setScreens([]);
    }
  };

  // Showtime Add
  const handleAddShowtime = async (e) => {
    e.preventDefault();
    if (!newShowtime.movieId || !newShowtime.theaterId || !newShowtime.screenId || !newShowtime.startTime) {
      triggerAlert('Please fill in all showtime details.', 'danger');
      return;
    }
    try {
      // Local time formatting for backend LocalDateTime (yyyy-MM-ddTHH:mm:ss)
      const formattedStartTime = newShowtime.startTime.includes(':00') ? newShowtime.startTime : `${newShowtime.startTime}:00`;
      
      await apiFetch('/admin/showtimes', {
        method: 'POST',
        body: JSON.stringify({
          movieId: Number(newShowtime.movieId),
          theaterId: Number(newShowtime.theaterId),
          screenId: Number(newShowtime.screenId),
          startTime: formattedStartTime,
          price: Number(newShowtime.price)
        })
      });
      triggerAlert('Showtime scheduled successfully.');
      setNewShowtime({ movieId: '', theaterId: '', screenId: '', startTime: '', price: 10.0 });
      setScreens([]);
    } catch (err) {}
  };

  const handleDeleteShowtime = async (id) => {
    if (!confirm('Are you sure you want to delete this showtime?')) return;
    try {
      await apiFetch(`/admin/showtimes/${id}`, { method: 'DELETE' });
      triggerAlert('Showtime deleted.');
      loadAdminStats();
    } catch (err) {}
  };

  // Filter movies lists
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          movie.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || movie.genre.includes(selectedGenre);
    
    // Filters based on available showtimes in the chosen city
    // If selectedCity is 'All', return everything
    // In real app, we would query the backend, but we filter client-side using our pre-loaded shows or city values.
    // To implement simple city filtering, let's verify if the movie has any showtimes in that city:
    return matchesSearch && matchesGenre;
  });

  // Get unique genres from movies list
  const allGenres = ['All', ...new Set(movies.flatMap(m => m.genre.split(',').map(g => g.trim())))];

  // Helper to format date nicely
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTimeString = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  // Seat Rows mapping (Row A to Row H, 12 seats per row)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const columns = Array.from({ length: 12 }, (_, i) => i + 1);

  const getSeatType = (row) => {
    if (['A', 'B'].includes(row)) return 'vip';
    if (['C', 'D', 'E'].includes(row)) return 'premium';
    return 'standard';
  };

  const getSeatPriceModifier = (type, basePrice) => {
    if (type === 'vip') return basePrice + 100;
    if (type === 'premium') return basePrice + 50;
    return basePrice;
  };

  const getSeatColor = (row) => {
    const type = getSeatType(row);
    if (type === 'vip') return 'vip';
    if (type === 'premium') return 'premium';
    return 'standard';
  };

  return (
    <div className="app-root">
      {/* Notifications Alert */}
      {alert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '12px 24px',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          background: alert.type === 'danger' ? 'var(--danger)' : 
                      alert.type === 'info' ? 'var(--accent)' : 'var(--success)',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {alert.message}
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-logo" onClick={() => setCurrentView('landing')}>
          CineVerse
        </div>
        <div className="nav-links">
          <span className={`nav-link ${currentView === 'landing' ? 'active' : ''}`} onClick={() => setCurrentView('landing')}>Home</span>
          {user && user.role !== 'ADMIN' && (
            <span className={`nav-link ${currentView === 'bookings-history' ? 'active' : ''}`} onClick={() => setCurrentView('bookings-history')}>My Bookings</span>
          )}
          {user && user.role === 'ADMIN' && (
            <span className={`nav-link ${currentView === 'admin-dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('admin-dashboard')}>Admin Panel</span>
          )}
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: '600' }}>
                👋 {user.name} ({user.role})
              </span>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span className="nav-link" onClick={() => { setAuthTab('admin-login'); setCurrentView('auth'); }} style={{ color: 'var(--accent)', cursor: 'pointer', marginRight: '10px', fontWeight: '600' }}>
                🔑 Admin Login
              </span>
              <button className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => { setAuthTab('login'); setCurrentView('auth'); }}>
                Sign In
              </button>
              <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }} onClick={() => { setAuthTab('register'); setCurrentView('auth'); }}>
                Register
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Areas */}
      <main style={{ padding: '2rem max(1rem, 5vw)', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* VIEW: LANDING PAGE */}
        {currentView === 'landing' && (
          <div className="animate-fade-in">
            {/* Promo banner removed */}

            {/* Filter Section */}
            <div id="movies-section" className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
                  <label>Select City</label>
                  <select 
                    className="form-input" 
                    value={selectedCity} 
                    onChange={(e) => setSelectedCity(e.target.value)}
                    style={{ background: 'var(--bg-main)', cursor: 'pointer' }}
                  >
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
                  <label>Genre</label>
                  <select 
                    className="form-input" 
                    value={selectedGenre} 
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    style={{ background: 'var(--bg-main)', cursor: 'pointer' }}
                  >
                    {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: '280px' }}>
                <label>Search Movies</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search by title, genre..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Movies Grid */}
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: '700' }} className="glow-text-primary">
              Recommended Movies
            </h2>

            {filteredMovies.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>No movies match your filters.</h3>
                <p>Try resetting the search terms or choosing another city.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '2rem'
              }}>
                {filteredMovies.map(movie => (
                  <div 
                    key={movie.id} 
                    className="glass-panel glass-panel-hover movie-card"
                    onClick={() => handleMovieSelect(movie)}
                  >
                    <div className="movie-poster-wrapper">
                      <img 
                        src={movie.posterUrl} 
                        alt={movie.title} 
                        className="movie-poster"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600";
                        }}
                      />
                      <div className="movie-card-overlay">
                        <span className="badge badge-primary" style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
                          ⭐ {movie.rating.toFixed(1)}/10
                        </span>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                          {movie.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                          {movie.genre}
                        </p>
                      </div>
                    </div>
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>{movie.duration} min</span> • <span>{movie.language}</span>
                      </div>
                      <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.85rem', padding: '6px 12px' }}>
                        Book Tickets
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: MOVIE DETAIL PAGE */}
        {currentView === 'movie-detail' && selectedMovie && (
          <div className="animate-fade-in">
            <button className="btn btn-outline" style={{ marginBottom: '1.5rem' }} onClick={() => setCurrentView('landing')}>
              ← Back to Movies
            </button>

            {/* Banner details */}
            <div className="detail-backdrop">
              <img src={selectedMovie.posterUrl} alt="" className="detail-backdrop-img" />
            </div>

            <div className="detail-content">
              {/* Left poster */}
              <div className="detail-poster-container">
                <img 
                  src={selectedMovie.posterUrl} 
                  alt={selectedMovie.title} 
                  style={{
                    width: '100%',
                    maxWidth: '240px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600";
                  }}
                />
              </div>

              {/* Right info */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '20px' }}>
                <span className="badge badge-primary" style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>
                  ⭐ {selectedMovie.rating.toFixed(1)} / 10 Rating
                </span>
                <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '800' }}>
                  {selectedMovie.title}
                </h1>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  <span>{selectedMovie.duration} mins</span>
                  <span>•</span>
                  <span>{selectedMovie.genre}</span>
                  <span>•</span>
                  <span>{selectedMovie.language}</span>
                  <span>•</span>
                  <span>Release: {selectedMovie.releaseDate}</span>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15,23,42,0.5)' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--accent)' }}>Synopsis</h3>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: '#cbd5e1' }}>
                    {selectedMovie.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Showtime Selection Section */}
            <div className="glass-panel" style={{ padding: '2rem', marginTop: '2.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', fontWeight: '700' }} className="glow-text-primary">
                Available Showtimes
              </h2>

              {movieShows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '1.1rem' }}>No active showtimes scheduled for this movie.</p>
                  {user?.role === 'ADMIN' && (
                    <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => { setCurrentView('admin-dashboard'); setAdminTab('shows'); }}>
                      Schedule Shows
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Group showtimes by Theater */}
                  {Array.from(new Set(movieShows.map(s => s.theater?.id))).map(theaterId => {
                    const theaterShows = movieShows.filter(s => s.theater?.id === theaterId);
                    const theater = theaterShows[0].theater;
                    
                    return (
                      <div key={theaterId} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        paddingBottom: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: '600', color: 'white' }}>
                            🎬 {theater.name}
                          </h3>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            📍 {theater.address}, {theater.city}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '5px' }}>
                          {theaterShows.map(show => (
                            <div 
                              key={show.id} 
                              className="glass-panel"
                              style={{
                                padding: '12px 18px',
                                cursor: 'pointer',
                                border: '1px solid rgba(139, 92, 246, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                transition: 'all 0.2s ease',
                                background: 'rgba(139, 92, 246, 0.05)'
                              }}
                              onClick={() => handleShowtimeSelect(show)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.boxShadow = '0 0 10px var(--primary-glow)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                {formatDateString(show.startTime).split(',')[1]}
                              </span>
                              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent)', margin: '4px 0' }}>
                                {formatTimeString(show.startTime)}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600' }}>
                                {show.screen?.name}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '4px', fontWeight: '600' }}>
                                ₹{show.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: SEAT SELECTION */}
        {currentView === 'seat-select' && selectedShow && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <button className="btn btn-outline" onClick={() => handleMovieSelect(selectedMovie)}>
                ← Back to Showtimes
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{selectedMovie.title}</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {selectedShow.theater?.name} | {selectedShow.screen?.name} | {formatDateString(selectedShow.startTime)} @ {formatTimeString(selectedShow.startTime)}
                </p>
              </div>
              <div style={{ width: '120px' }}></div> {/* spacer */}
            </div>

            <div className="glass-panel" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
              
              {/* Screen Visual */}
              <div className="screen-visual">SCREEN THIS WAY</div>

              {/* Seating Layout Grid */}
              <div className="seating-container">
                {rows.map(row => (
                  <div className="seat-row" key={row}>
                    <div className="row-label">{row}</div>
                    
                    {columns.map(col => {
                      const seatId = `${row}${col}`;
                      const seatType = getSeatType(row);
                      const isBooked = bookedSeatsForShow.includes(seatId);
                      const isSelected = selectedSeats.includes(seatId);
                      
                      return (
                        <React.Fragment key={col}>
                          {col === 3 || col === 11 ? <div className="seat-space" /> : null}
                          <div 
                            className={`seat ${seatType} ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                            onClick={() => toggleSeat(seatId)}
                            title={`${seatId} (${seatType.toUpperCase()}) - $${getSeatPriceModifier(seatType, selectedShow.price).toFixed(2)}`}
                          >
                            {col}
                          </div>
                        </React.Fragment>
                      );
                    })}
                    
                    <div className="row-label">{row}</div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="seating-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ border: '1.5px solid var(--seat-standard)', background: 'rgba(59,130,246,0.15)' }} />
                  <span>Standard (₹{selectedShow.price.toFixed(2)})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ border: '1.5px solid var(--seat-premium)', background: 'rgba(168,85,247,0.15)' }} />
                  <span>Premium (₹{(selectedShow.price + 50).toFixed(2)})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ border: '1.5px solid var(--seat-vip)', background: 'rgba(234,179,8,0.15)' }} />
                  <span>VIP (₹{(selectedShow.price + 100).toFixed(2)})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: 'var(--seat-selected)' }} />
                  <span>Selected</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: 'var(--seat-booked)' }} />
                  <span>Booked</span>
                </div>
              </div>

              {/* Total Calculation Panel */}
              <div style={{
                marginTop: '2.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Selected Seats:</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent)', minHeight: '28px' }}>
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Payable:</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--success)' }}>
                      ₹{selectedSeats.reduce((acc, seat) => {
                        const row = seat[0];
                        return acc + getSeatPriceModifier(getSeatType(row), selectedShow.price);
                      }, 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={handleBookSeatsSubmit}
                    disabled={selectedSeats.length === 0}
                    style={{ padding: '12px 28px' }}
                  >
                    Book Tickets →
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW: PAYMENT SIMULATION */}
        {currentView === 'payment' && createdBooking && (
          <div className="animate-fade-in">
            <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: '700' }} className="glow-text-primary">
              Secure Checkout
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2.5rem',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              {/* Order Summary */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                  Order Summary
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Movie</span>
                    <span style={{ fontWeight: '600' }}>{selectedMovie.title}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Showtime</span>
                    <span style={{ fontWeight: '600' }}>{formatTimeString(selectedShow.startTime)}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Seats ({selectedSeats.length})</span>
                    <span style={{ fontWeight: '600', color: 'var(--accent)' }}>{createdBooking.seatNumbers}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Cinema</span>
                    <span style={{ fontWeight: '500' }}>{selectedShow.theater?.name}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Email Confirmation</span>
                    <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>{createdBooking.userEmail}</span>
                  </div>
                  
                  <div className="ticket-divider" style={{ margin: '15px 0' }} />
                  
                  <div className="flex-between" style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                    <span>Amount Due</span>
                    <span style={{ color: 'var(--success)' }}>₹{createdBooking.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>
                  Payment Method
                </h3>
                
                <form onSubmit={handlePaymentSubmit}>
                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="John Doe" 
                      required 
                      defaultValue={user?.name}
                    />
                  </div>
                  <div className="form-group">
                    <label>Credit Card Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="4111 2222 3333 4444" 
                      maxLength="19"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      required 
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Expiration Date</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="MM/YY" 
                        maxLength="5"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV / CVC</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="***" 
                        maxLength="3"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px', marginTop: '1rem' }}
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="spinner" style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Processing Transaction...
                      </span>
                    ) : `Pay ₹${createdBooking.totalPrice.toFixed(2)}`}
                  </button>
                </form>
              </div>
            </div>
            
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {/* VIEW: TICKET SUCCESS SCREEN */}
        {currentView === 'ticket-success' && createdBooking && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2.5px solid var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              color: 'var(--success)',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
            }}>
              ✓
            </div>
            
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', margin: '0 0 10px 0' }}>
              Booking Confirmed!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
              Your ticket has been booked successfully! A confirmation receipt and your digital ticket have been sent to <strong>{createdBooking.userEmail}</strong>.
            </p>

            {/* Render Boarding Pass Style Digital Ticket */}
            <div className="ticket-card">
              <div className="ticket-header">
                <span className="badge badge-secondary" style={{ marginBottom: '8px' }}>DIGITAL ADMIT ONE</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>{selectedMovie.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({selectedMovie.language})</span>
              </div>
              
              <div className="ticket-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 10px', textAlign: 'left', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cinema</div>
                    <div style={{ fontWeight: '600' }}>{selectedShow.theater?.name}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Auditorium</div>
                    <div style={{ fontWeight: '600' }}>{selectedShow.screen?.name}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</div>
                    <div style={{ fontWeight: '600' }}>{formatDateString(selectedShow.startTime).split(',')[1]}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Showtime</div>
                    <div style={{ fontWeight: '600', color: 'var(--accent)' }}>{formatTimeString(selectedShow.startTime)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Seat Numbers</div>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.05rem' }}>{createdBooking.seatNumbers}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Receipt Total</div>
                    <div style={{ fontWeight: '600' }}>₹{createdBooking.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="ticket-divider" />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Verification Code
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '3px', color: 'white', margin: '4px 0 12px 0' }}>
                    {createdBooking.ticketCode}
                  </span>
                  
                  {/* Visual QR Code Mock */}
                  <div className="ticket-barcode">
                    <div style={{
                      width: '90px',
                      height: '90px',
                      background: '#1e293b',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      color: 'var(--accent)'
                    }}>
                      [ QR CODE ]
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setCurrentView('landing')}>
                Back to Home
              </button>
              <button className="btn btn-outline" onClick={() => setCurrentView('bookings-history')}>
                View My Bookings
              </button>
            </div>
          </div>
        )}

        {/* VIEW: BOOKING HISTORY */}
        {currentView === 'bookings-history' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: '700' }} className="glow-text-primary">
              Your Booking History
            </h2>

            {userBookings.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3>You haven't booked any movie tickets yet.</h3>
                <p>Browse our list of recommended movies to get started!</p>
                <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => setCurrentView('landing')}>
                  Browse Movies
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {userBookings.map(history => {
                  const b = history.booking;
                  const movie = history.movie;
                  const theater = history.theater;
                  const showtime = history.showtime;
                  
                  return (
                    <div key={b.id} className="glass-panel" style={{
                      padding: '1.5rem',
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 150px',
                      gap: '1.5rem',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '110px',
                        borderRadius: '8px',
                        background: '#1e293b',
                        overflow: 'hidden'
                      }}>
                        <img 
                          src={movie?.posterUrl} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600";
                          }}
                        />
                      </div>
                      
                      <div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: 'white' }}>
                          {movie?.title}
                        </h3>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#e2e8f0' }}>
                          🎬 {theater?.name} | {history.screen?.name}
                        </p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          📅 {showtime ? formatDateString(showtime.startTime) : ''} @ {showtime ? formatTimeString(showtime.startTime) : ''}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Seats:</span>
                          <strong style={{ color: 'var(--accent)' }}>{b.seatNumbers}</strong>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid Amount</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--success)' }}>₹{b.totalPrice.toFixed(2)}</div>
                        </div>
                        <span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-primary' : 'badge-secondary'}`} style={{ alignSelf: 'flex-end' }}>
                          {b.paymentStatus}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          Code: {b.ticketCode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW: AUTHENTICATION */}
        {currentView === 'auth' && (
          <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
              
              {authTab === 'admin-login' ? (
                <div>
                  <h2 style={{ textAlign: 'center', margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent)' }}>
                    Admin Workspace
                  </h2>
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    Authorized personnel sign-in portal
                  </p>
                  
                  <form onSubmit={handleLoginSubmit}>
                    <div className="form-group">
                      <label>Admin Email</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder="cineversebyrudra@gmail.com" 
                        required 
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Secret Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="••••••••" 
                        required 
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '1rem' }}>
                      Authenticate Admin →
                    </button>

                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      style={{ width: '100%', padding: '8px', marginTop: '1rem', fontSize: '0.85rem' }}
                      onClick={() => setAuthTab('login')}
                    >
                      ← Customer Sign In
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '2rem' }}>
                    <button 
                      className="nav-link" 
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        paddingBottom: '12px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1.1rem',
                        fontWeight: authTab === 'login' ? '700' : '400',
                        borderBottom: authTab === 'login' ? '2px solid var(--primary)' : 'none',
                        color: authTab === 'login' ? 'white' : 'var(--text-muted)'
                      }}
                      onClick={() => setAuthTab('login')}
                    >
                      Sign In
                    </button>
                    <button 
                      className="nav-link" 
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        paddingBottom: '12px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1.1rem',
                        fontWeight: authTab === 'register' ? '700' : '400',
                        borderBottom: authTab === 'register' ? '2px solid var(--primary)' : 'none',
                        color: authTab === 'register' ? 'white' : 'var(--text-muted)'
                      }}
                      onClick={() => setAuthTab('register')}
                    >
                      Register
                    </button>
                  </div>

                  {authTab === 'login' ? (
                    <form onSubmit={handleLoginSubmit}>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          placeholder="name@email.com" 
                          required 
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          required 
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                      </div>
                      
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '1rem' }}>
                        Sign In
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegisterSubmit}>
                      <div className="form-group">
                        <label>Your Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="John Doe" 
                          required 
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          placeholder="name@email.com" 
                          required 
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Date of Birth (DOB)</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          required 
                          value={regDob}
                          onChange={(e) => setRegDob(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="••••••••" 
                          required 
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                      </div>
                      {/* Role selection hidden (defaults to USER for security) */}
                      
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '1rem' }}>
                        Create Account
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {currentView === 'admin-dashboard' && user?.role === 'ADMIN' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: '800' }} className="glow-text-primary">
              Control Panel & Analytics
            </h1>

            {/* Admin Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button 
                className={`btn ${adminTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setAdminTab('overview')}
              >
                📊 System Overview
              </button>
              <button 
                className={`btn ${adminTab === 'movies' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setAdminTab('movies')}
              >
                🎬 Manage Movies
              </button>
              <button 
                className={`btn ${adminTab === 'theaters' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setAdminTab('theaters')}
              >
                🏢 Theaters & Screens
              </button>
              <button 
                className={`btn ${adminTab === 'shows' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setAdminTab('shows')}
              >
                📅 Schedule Shows
              </button>
              <button 
                className={`btn ${adminTab === 'bookings' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setAdminTab('bookings')}
              >
                🎟 Bookings & Sales
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {adminTab === 'overview' && (
              <div className="animate-fade-in">
                <div className="stats-grid">
                  <div className="glass-panel stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>💵</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gross Revenue</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>₹{adminStats.totalRevenue.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="glass-panel stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc' }}>🎟</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tickets Issued</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{adminStats.ticketsSold}</div>
                    </div>
                  </div>
                  <div className="glass-panel stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#22d3ee' }}>🎬</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Movies</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{adminStats.activeMovies}</div>
                    </div>
                  </div>
                  <div className="glass-panel stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#fef08a' }}>📅</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scheduled Shows</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{adminStats.activeShows}</div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }}>Recent Booking Transactions</h3>
                  
                  {adminStats.bookings.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No booking transactions recorded yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '10px' }}>User Email</th>
                            <th style={{ padding: '10px' }}>Movie</th>
                            <th style={{ padding: '10px' }}>Seats</th>
                            <th style={{ padding: '10px' }}>Date & Time</th>
                            <th style={{ padding: '10px' }}>Price</th>
                            <th style={{ padding: '10px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminStats.bookings.slice(0, 8).map(detail => {
                            const b = detail.booking;
                            return (
                              <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '12px 10px' }}>{b.userEmail}</td>
                                <td style={{ padding: '12px 10px', fontWeight: '600' }}>{detail.movie?.title}</td>
                                <td style={{ padding: '12px 10px', color: 'var(--accent)', fontWeight: '700' }}>{b.seatNumbers}</td>
                                <td style={{ padding: '12px 10px' }}>
                                  {detail.showtime ? `${formatDateString(detail.showtime.startTime).split(',')[1]} @ ${formatTimeString(detail.showtime.startTime)}` : ''}
                                </td>
                                <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--success)' }}>₹{b.totalPrice.toFixed(2)}</td>
                                <td style={{ padding: '12px 10px' }}>
                                  <span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-primary' : 'badge-secondary'}`}>
                                    {b.paymentStatus}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MANAGE MOVIES */}
            {adminTab === 'movies' && (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                {/* Form Add */}
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }} className="glow-text-primary">Add Movie</h3>
                  <form onSubmit={handleAddMovie}>
                    <div className="form-group">
                      <label>Movie Title</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        placeholder="e.g. Inception"
                        value={newMovie.title}
                        onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Description / Synopsis</label>
                      <textarea 
                        className="form-input" 
                        rows="3" 
                        placeholder="Brief storyline..."
                        value={newMovie.description}
                        onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Duration (mins)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          required 
                          value={newMovie.duration}
                          onChange={(e) => setNewMovie({ ...newMovie, duration: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label>IMDb Rating</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          max="10" 
                          className="form-input" 
                          required 
                          value={newMovie.rating}
                          onChange={(e) => setNewMovie({ ...newMovie, rating: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Genres (comma separated)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Sci-Fi, Action, Thriller" 
                        required 
                        value={newMovie.genre}
                        onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Language</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          required 
                          value={newMovie.language}
                          onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Release Date</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          required 
                          value={newMovie.releaseDate}
                          onChange={(e) => setNewMovie({ ...newMovie, releaseDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Poster Image URL</label>
                      <input 
                        type="url" 
                        className="form-input" 
                        placeholder="https://images.unsplash.com/photo..."
                        value={newMovie.posterUrl}
                        onChange={(e) => setNewMovie({ ...newMovie, posterUrl: e.target.value })}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                      Publish Movie
                    </button>
                  </form>
                </div>

                {/* List Table */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }}>Active Inventory ({movies.length})</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {movies.map(m => (
                      <div key={m.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={m.posterUrl} alt="" style={{ width: '40px', height: '55px', borderRadius: '4px', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: '600' }}>{m.title}</div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.genre} | ⭐ {m.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <button className="btn btn-outline" style={{ padding: '6px 12px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleDeleteMovie(m.id)}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MANAGE THEATERS & SCREENS */}
            {adminTab === 'theaters' && (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Form Add Theater */}
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }} className="glow-text-primary">Add New Theater</h3>
                  <form onSubmit={handleAddTheater}>
                    <div className="form-group">
                      <label>Theater Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        placeholder="e.g. IMAX Prestige" 
                        value={newTheater.name}
                        onChange={(e) => setNewTheater({ ...newTheater, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ margin: 0 }}>City Location</label>
                        <span 
                          onClick={() => setIsAddingNewCity(!isAddingNewCity)} 
                          style={{ fontSize: '0.8rem', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }}
                        >
                          {isAddingNewCity ? '← Choose Existing' : '＋ Add New City'}
                        </span>
                      </div>
                      
                      {isAddingNewCity ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          required 
                          placeholder="e.g. Pune, Chennai, Kolkata" 
                          value={customCityName}
                          onChange={(e) => setCustomCityName(e.target.value)}
                        />
                      ) : (
                        <select 
                          className="form-input" 
                          required 
                          value={newTheater.city}
                          onChange={(e) => setNewTheater({ ...newTheater, city: e.target.value })}
                          style={{ background: 'var(--bg-main)', cursor: 'pointer' }}
                        >
                          <option value="">-- Choose City --</option>
                          {cities.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Address Details</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        placeholder="Shopping complex, sector, street..." 
                        value={newTheater.address}
                        onChange={(e) => setNewTheater({ ...newTheater, address: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                      Register Theater
                    </button>
                  </form>

                  <div className="ticket-divider" style={{ margin: '2rem 0' }} />

                  {/* Form Add Screen to Theater */}
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }} className="glow-text-primary">Add Screen to Theater</h3>
                  <form onSubmit={handleAddScreen}>
                    <div className="form-group">
                      <label>Select Theater</label>
                      <select 
                        className="form-input" 
                        required
                        value={newScreen.theaterId}
                        onChange={(e) => setNewScreen({ ...newScreen, theaterId: e.target.value })}
                        style={{ background: 'var(--bg-main)' }}
                      >
                        <option value="">-- Choose Theater --</option>
                        {theaters.map(t => <option key={t.id} value={t.id}>{t.name} ({t.city})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Screen Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        required 
                        placeholder="e.g. Screen 1, IMAX Screen" 
                        value={newScreen.name}
                        onChange={(e) => setNewScreen({ ...newScreen, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Seating Capacity</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        required 
                        value={newScreen.totalSeats}
                        onChange={(e) => setNewScreen({ ...newScreen, totalSeats: Number(e.target.value) })}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                      Add Screen
                    </button>
                  </form>
                </div>

                {/* List Theaters */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }}>Registered Venues ({theaters.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {theaters.map(t => (
                      <div key={t.id} style={{
                        padding: '15px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div className="flex-between">
                          <div>
                            <span className="badge badge-accent" style={{ marginRight: '8px' }}>{t.city}</span>
                            <strong style={{ fontSize: '1.1rem', color: 'white' }}>{t.name}</strong>
                          </div>
                          <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleDeleteTheater(t.id)}>
                            Delete
                          </button>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {t.address}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SCHEDULE SHOWTIMES */}
            {adminTab === 'shows' && (
              <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
                {/* Form Add Show */}
                <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }} className="glow-text-primary">Schedule New Showtime</h3>
                  <form onSubmit={handleAddShowtime}>
                    <div className="form-group">
                      <label>Select Movie</label>
                      <select 
                        className="form-input" 
                        required
                        value={newShowtime.movieId}
                        onChange={(e) => setNewShowtime({ ...newShowtime, movieId: e.target.value })}
                        style={{ background: 'var(--bg-main)' }}
                      >
                        <option value="">-- Choose Movie --</option>
                        {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Select Theater</label>
                      <select 
                        className="form-input" 
                        required
                        value={newShowtime.theaterId}
                        onChange={(e) => {
                          setNewShowtime({ ...newShowtime, theaterId: e.target.value, screenId: '' });
                          loadScreensForTheater(e.target.value);
                        }}
                        style={{ background: 'var(--bg-main)' }}
                      >
                        <option value="">-- Choose Theater --</option>
                        {theaters.map(t => <option key={t.id} value={t.id}>{t.name} ({t.city})</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Select Screen</label>
                      <select 
                        className="form-input" 
                        required
                        disabled={!newShowtime.theaterId}
                        value={newShowtime.screenId}
                        onChange={(e) => setNewShowtime({ ...newShowtime, screenId: e.target.value })}
                        style={{ background: 'var(--bg-main)' }}
                      >
                        <option value="">-- Choose Screen --</option>
                        {screens.map(s => <option key={s.id} value={s.id}>{s.name} (Cap: {s.totalSeats} seats)</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Start Date & Time</label>
                        <input 
                          type="datetime-local" 
                          className="form-input" 
                          required 
                          value={newShowtime.startTime}
                          onChange={(e) => setNewShowtime({ ...newShowtime, startTime: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Base Price (₹)</label>
                        <input 
                          type="number" 
                          step="10" 
                          className="form-input" 
                          required 
                          value={newShowtime.price}
                          onChange={(e) => setNewShowtime({ ...newShowtime, price: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                      Schedule Show
                    </button>
                  </form>
                </div>

                {/* List Shows */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }}>Active Scheduled Screenings ({adminStats.bookings.reduce((acc, currentObj) => {
                    // Let's count unique shows listed in admin stats
                    return acc;
                  }, 0) || adminStats.activeShows})</h3>
                  
                  {/* Fetch showtimes and list them with a delete button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* We can list showtimes. Let's retrieve all showtimes. Since we don't have a direct showtimes list in stats, we can fetch all showtimes of movies or just list recent showtimes based on bookings, or let's create a custom hook. In fact, since we have the dashboard statistics API, we can display shows listed in recent bookings, or better: list active shows. 
                       Wait, how do we query all shows? In our stats we have all bookings. Let's make a quick API query or extract from movie shows. Since movie shows are loaded when selecting a movie, what if we load all showtimes?
                       Actually, the admin stats response has all bookings. Let's check how we can get all showtimes. Let's write a simple query, or since the seeder adds shows, the admin can delete shows from the list.
                       Let's display showtimes currently active in the system. We can render a scrollable list. Wait, in admin, it's very easy to just list the seed showtimes. How can we get them? We can fetch all showtimes in our admin panel. 
                       Let's create an API in admin controller `GET /api/admin/showtimes`? Wait! We don't have this API. But we can fetch showtimes for all movies! Since we have the list of all movies, we can fetch their showtimes in a loop, or fetch them on request.
                       Wait, let's create a unified list. The admin can see the screenings in the bookings list, or let's write a small API addition? No, we don't need to. We can write a simple client-side load that fetches shows for each movie and aggregates them! That is very clean.
                    */}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px' }}>
                      *Tip: To view and schedule showtimes, select a movie from the homepage or schedule them here.
                    </div>
                    {movies.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)' }}>No movies registered to query screenings.</p>
                    ) : (
                      <AdminShowtimesList 
                        movies={movies} 
                        apiFetch={apiFetch} 
                        formatDateString={formatDateString}
                        formatTimeString={formatTimeString}
                        onDeleteShow={handleDeleteShowtime}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ALL BOOKINGS */}
            {adminTab === 'bookings' && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: '700' }}>All Ticket Receipts ({adminStats.bookings.length})</h3>
                
                {adminStats.bookings.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No tickets booked yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '10px' }}>ID</th>
                          <th style={{ padding: '10px' }}>User Email</th>
                          <th style={{ padding: '10px' }}>Movie Title</th>
                          <th style={{ padding: '10px' }}>Seats</th>
                          <th style={{ padding: '10px' }}>Venue & Screen</th>
                          <th style={{ padding: '10px' }}>Date & Time</th>
                          <th style={{ padding: '10px' }}>Total Paid</th>
                          <th style={{ padding: '10px' }}>Status</th>
                          <th style={{ padding: '10px' }}>Ticket Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminStats.bookings.map(detail => {
                          const b = detail.booking;
                          return (
                            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>#{b.id}</td>
                              <td style={{ padding: '12px 10px' }}>{b.userEmail}</td>
                              <td style={{ padding: '12px 10px', fontWeight: '600' }}>{detail.movie?.title}</td>
                              <td style={{ padding: '12px 10px', color: 'var(--accent)', fontWeight: '700' }}>{b.seatNumbers}</td>
                              <td style={{ padding: '12px 10px' }}>{detail.theater?.name} - {detail.screen?.name}</td>
                              <td style={{ padding: '12px 10px' }}>
                                {detail.showtime ? `${formatDateString(detail.showtime.startTime).split(',')[1]} @ ${formatTimeString(detail.showtime.startTime)}` : ''}
                              </td>
                              <td style={{ padding: '12px 10px', fontWeight: '700', color: 'var(--success)' }}>₹{b.totalPrice.toFixed(2)}</td>
                              <td style={{ padding: '12px 10px' }}>
                                <span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-primary' : 'badge-secondary'}`}>
                                  {b.paymentStatus}
                                </span>
                              </td>
                              <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: '600' }}>{b.ticketCode}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '5rem',
        padding: '2.5rem 0',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(11, 15, 25, 0.9)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>CineVerse</strong> - Digital Movie Ticketing System
        </div>
        <div>
          &copy; 2026 Movie Tickets Booking Software. Built with React & Spring Boot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// Subcomponent to aggregate showtimes for the admin panel
function AdminShowtimesList({ movies, apiFetch, formatDateString, formatTimeString, onDeleteShow }) {
  const [allShows, setAllShows] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAllShows = async () => {
    setLoading(true);
    let aggregated = [];
    try {
      for (const movie of movies) {
        const shows = await apiFetch(`/movies/${movie.id}/shows`);
        aggregated = [...aggregated, ...shows];
      }
      // Sort showtimes by start time
      aggregated.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      setAllShows(aggregated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllShows();
  }, [movies]);

  if (loading) return <p>Loading screenings...</p>;
  if (allShows.length === 0) return <p>No scheduled screenings found.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto', paddingRight: '5px' }}>
      {allShows.map(show => (
        <div key={show.id} style={{
          padding: '12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: '600', color: 'white' }}>{show.movie?.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              🎥 {show.theater?.name} ({show.screen?.name})
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '600', marginTop: '3px' }}>
              📅 {formatDateString(show.startTime).split(',')[1]} @ {formatTimeString(show.startTime)}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 12px', color: 'var(--accent)', borderColor: 'rgba(234, 179, 8, 0.2)' }}
              onClick={async () => {
                if (confirm('Are you sure you want to empty all booked seats for this screening?')) {
                  try {
                    await apiFetch(`/admin/showtimes/${show.id}/empty-seats`, { method: 'POST' });
                    alert('Seating has been cleared successfully.');
                  } catch (err) {
                    console.error(err);
                  }
                }
              }}
            >
              🧹 Empty Seats
            </button>
            
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 12px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              onClick={async () => {
                await onDeleteShow(show.id);
                loadAllShows(); // refresh list
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
