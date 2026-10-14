import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("hb_access_token");
      if (token) {
        try {
          const response = await api.get("/auth/me");
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem("hb_access_token");
          localStorage.removeItem("hb_user_role");
          setUser(null);
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const { access_token, user_role } = response.data;
    localStorage.setItem("hb_access_token", access_token);
    localStorage.setItem("hb_user_role", user_role);

    const userProfile = await api.get("/auth/me");
    setUser(userProfile.data);
    return userProfile.data;
  };

  const register = async (userData) => {
    await api.post("/auth/register", userData);
  };

  const logout = () => {
    localStorage.removeItem("hb_access_token");
    localStorage.removeItem("hb_user_role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
