import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState("light");

    // Load saved theme on startup
    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem("appTheme");
            if (saved) setTheme(saved);
        })();
    }, []);

    // Persist theme choice
    useEffect(() => {
        AsyncStorage.setItem("appTheme", theme);
    }, [theme]);

    const toggleTheme = () =>
        setTheme((prev) => (prev === "light" ? "dark" : "light"));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
