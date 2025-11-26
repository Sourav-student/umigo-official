import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Create Axios instance with base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// JWT Token Management
const TOKEN_KEY = "jwtToken";

/**
 * Set authentication token in localStorage
 * @param {string} token - JWT token to store
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    // Set default auth header for future requests
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    removeToken();
  }
};

/**
 * Get stored authentication token
 * @returns {string|null} Stored JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove authentication token from storage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common["Authorization"];
};

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token management
api.interceptors.response.use(
  (response) => response.data, // Return only the data payload for successful responses
  (error) => {
    const { response } = error;
    let errorMessage = "An unexpected error occurred";

    // Handle different error statuses
    if (response) {
      errorMessage = response.data?.error || response.statusText;

      // Handle specific status codes
      if (response.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
        removeToken();
        // Optionally redirect to login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else if (response.status === 403) {
        errorMessage = "You do not have permission to perform this action";
      } else if (response.status === 404) {
        errorMessage = "The requested resource was not found";
      } else if (response.status >= 500) {
        errorMessage = "Please log in to continue.";
      }

      // If the server returns a 500 but the error message suggests auth issues, treat it as auth error
      if (response.status >= 500 && response.data?.error?.toLowerCase().includes('token')) {
        errorMessage = "Your session has expired. Please log in again.";
        removeToken();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    } else if (error.code === "ECONNABORTED") {
      errorMessage =
        "Request timeout. Please check your connection and try again.";
    } else if (error.message === "Network Error") {
      errorMessage = "Network error. Please check your internet connection.";
    }

    // Log error for debugging
    console.error("API Error:", {
      status: response?.status,
      message: errorMessage,
      url: error.config?.url,
      error: error.message,
    });

    // Return standardized error object
    return Promise.reject({
      status: response?.status,
      message: errorMessage,
      originalError: error,
      response: response?.data,
    });
  }
);

/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */
export const authAPI = {
  /**
   * Login user with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} Response data with token and user info
   * @throws {Object} Error object with status and message
   */
  login: async ({ email, password }) => {
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }

    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("response login : ", response);
      // Handle successful login
      if (response.token) {
        setToken(response.token);
        return {
          success: true,
          token: response.token,
          user: response.user,
          redirect: response.redirect,
        };
      }

      throw new Error("Invalid response from server");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Login failed";
      throw {
        status: error.response?.status || 500,
        message: errorMessage,
        originalError: error,
      };
    }
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User's email
   * @param {string} userData.name - User's full name
   * @param {string} userData.password - User's password (min 6 chars)
   * @param {string} [userData.phone_no] - User's phone number
   * @param {string} [userData.role='user'] - User role (user/mod/admin/ADMIN)
   * @param {string} [userData.subscription_type='free'] - Subscription type (free/pro/premium)
   * @returns {Promise<Object>} Response data with token and user info
   * @throws {Object} Error object with status and message
   */
  register: async (userData) => {
    const { email, name, password } = userData;

    if (!email || !name || !password) {
      throw { status: 400, message: "Email, name, and password are required" };
    }

    if (password.length < 6) {
      throw { status: 400, message: "Password must be at least 6 characters" };
    }

    try {
      const response = await api.post("/auth/register", {
        email,
        name,
        password,
        phone_no: userData.phone_no || "",
        role: userData.role || "USER",
        subscription_type: userData.subscription_type || "free",
      });

      // Handle successful registration
      if (response.token) {
        setToken(response.token);
        return {
          success: true,
          message: "Registration successful",
          token: response.token,
          user: response.user,
        };
      }

      throw new Error("Invalid response from server");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Registration failed";
      throw {
        status: error.response?.status || 500,
        message: errorMessage,
        originalError: error,
      };
    }
  },

  /**
   * Logout user by removing the authentication token
   * @returns {Promise<boolean>} True if logout was successful
   */
  logout: async () => {
    try {
      // Call the logout endpoint if it exists
      await api.post("/auth/logout");
    } catch (error) {
      console.warn(
        "Logout endpoint failed, proceeding with client-side logout",
        error
      );
    } finally {
      // Always remove the token from client-side storage
      removeToken();
      return true;
    }
  },

  /**
   * Get the currently authenticated user's profile
   * @returns {Promise<Object>} User profile data
   * @throws {Object} Error object with status and message
   */
  getProfile: async () => {
    const token = getToken();

    try {
      const decoded = jwtDecode(token);

      const isExpired = decoded.isExpired * 1000 < Date.now();

      if (isExpired) {
        throw new Error("JWT Token Expired");
      }

      const userData = decoded;

      if (!userData) {
        throw new Error("No user data received");
      }

      return userData;
    } catch (error) {
      console.error("Error fetching user profile:", error);

      // Clear token if unauthorized
      if (error.response?.status === 401) {
        removeToken();
      }

      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to fetch user profile",
        originalError: error,
      };
    }
  },

  /**
   * Check if the user is authenticated
   * @returns {Promise<boolean>} True if authenticated, false otherwise
   */
  isAuthenticated: async () => {
    const token = getToken();
    if (!token) return false;

    try {
      // If we have a token, verify it's still valid by making a profile request
      await authAPI.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  },
};

/**
 * User API Service
 * Handles all user-related API calls
 */
export const userAPI = {
  /**
   * Update current user's profile
   * @param {Object} userData - User data to update
   * @param {string} [userData.name] - Updated name
   * @param {string} [userData.bio] - Updated bio
   * @param {string} [userData.phone_no] - Updated phone number
   * @returns {Promise<Object>} Updated user data
   */
  updateProfile: async (userData) => {
    try {
      const response = await api.put("/api/user/update", {
        name: userData.name,
        bio: userData.bio,
        phone_no: userData.phone_no,
      });

      return response.data?.user || response.data;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message:
          error.response?.data?.error || "Failed to update profile",
        originalError: error,
      };
    }
  },

  uploadPicture: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await api.post("/api/user/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response; // contains { image_url }
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message:
          error.response?.data?.error ||
          "Failed to upload profile picture",
        originalError: error,
      };
    }
  },

  /**
   * Get user by ID
   * @param {string} userId - User ID to fetch
   * @returns {Promise<Object>} User data
   */
  getUser: async (userId) => {
    try {
      const response = await api.get(`/api/user/${userId}`);
      return response.user || response.data?.user || response;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to fetch user",
        originalError: error,
      };
    }
  },

  /**
   * Get Current user 
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get(`/api/user/me`);
      console.log(response);
      return response.user || response.data?.user || response;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to fetch user",
        originalError: error,
      };
    }
  },

  /**
   * Get users with glow mode enabled
   * @returns {Promise<Array>} List of users with glow mode enabled
   */
  getGlowUsers: async () => {
    try {
      const response = await api.get("/api/user/glow");
      
      return response.users || [];
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to fetch glow users",
        originalError: error,
      };
    }
  },

  /**
   * Update user's glow mode status
   * @param {boolean} glowMode - Whether to enable or disable glow mode
   * @returns {Promise<Object>} Update result
   */
  updateGlowMode: async (glowMode) => {
    try {
      const response = await api.put("/api/user/glow", { glow_mode: glowMode });
      return response;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to update glow mode",
        originalError: error,
      };
    }
  },

  /**
   * Upload profile picture
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Upload result with image URL
   */
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(
        "/api/user/upload-profile-picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message:
          error.response?.data?.error || "Failed to upload profile picture",
        originalError: error,
      };
    }
  },
};

/**
 * Events API Service
 * Handles all event-related API calls
 */
export const eventsAPI = {
  /**
   * Get all events with optional filters
   * @param {Object} [params] - Query parameters
   * @param {string} [params.status] - Filter by status (upcoming, past, ongoing)
   * @param {number} [params.limit] - Limit number of results
   * @param {number} [params.offset] - Offset for pagination
   * @returns {Promise<Array>} List of events
   */
  getEvents: async (params = {}) => {
    try {
      const response = await api.get("/api/events", { params });
      return response.events || response.data?.events || [];
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to fetch events",
        originalError: error,
      };
    }
  },

  /**
   * Get single event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Event details
   */
  getEvent: async (eventId) => {
    try {
      const response = await api.get(`/api/events/${eventId}`);
      return response.event || response.data?.event || response;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to fetch event",
        originalError: error,
      };
    }
  },

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created event
   */
  createEvent: async (eventData) => {
    try {
      const response = await api.post("/api/events", eventData);
      return response.event || response.data?.event || response;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to create event",
        originalError: error,
        validationErrors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Update an existing event
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise<Object>} Updated event
   */
  updateEvent: async (eventId, eventData) => {
    try {
      const response = await api.put(`/api/events/${eventId}`, eventData);
      return response.event || response.data?.event || response;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to update event",
        originalError: error,
        validationErrors: error.response?.data?.errors,
      };
    }
  },

  /**
   * Delete an event
   * @param {string} eventId - Event ID to delete
   * @returns {Promise<Object>} Deletion result
   */
  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/api/events/${eventId}`);
      return { success: true, ...response };
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to delete event",
        originalError: error,
      };
    }
  },

  /**
   * RSVP to an event
   * @param {string} eventId - Event ID
   * @param {string} status - RSVP status (going, maybe, not_going)
   * @returns {Promise<Object>} RSVP result
   */
  rsvpToEvent: async (eventId, status) => {
    try {
      const response = await api.post(`/api/events/${eventId}/rsvp`, {
        status,
      });
      return response;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.error || "Failed to update RSVP",
        originalError: error,
      };
    }
  },
};

// Export the configured axios instance for direct use if needed
export default api;
