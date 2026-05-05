import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './components/ThemeContext';
import { AppNavigator } from './navigations/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}