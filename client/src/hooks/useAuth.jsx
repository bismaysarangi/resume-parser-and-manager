import { useState, useContext, createContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to load auth from localStorage
  const loadAuthFromStorage = () => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadAuthFromStorage();
  }, []);

  // Listen for auth changes (logout from Navbar)
  useEffect(() => {
    const handleAuthChange = () => {
      loadAuthFromStorage();
    };

    // Listen for the custom event dispatched by Navbar
    window.addEventListener("authStatusChanged", handleAuthChange);

    // Listen for storage changes (logout from another tab)
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authStatusChanged", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
    // Dispatch event so Navbar updates too
    window.dispatchEvent(new Event("authStatusChanged"));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    // Dispatch event so Navbar updates too
    window.dispatchEvent(new Event("authStatusChanged"));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};