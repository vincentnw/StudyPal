import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import SignInSignUp from './pages/SignInSignUp';
import LoggedInHome from './pages/LoggedinHome';
import NoteGenerator from './pages/NoteGenerator';
import FlashcardGenerator from './pages/FlashcardGenerator';
import QuizGenerator from './pages/QuizGenerator';
import { AuthContext } from './contexts/AuthContext';
import Account from './pages/Account';
import '@fortawesome/fontawesome-free/css/all.min.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<SignInSignUp />} />
        <Route path="/signup" element={<SignInSignUp />} />

        <Route path="/home" element={<ProtectedRoute><LoggedInHome /></ProtectedRoute>} />
        <Route path="/note-generator" element={<ProtectedRoute><NoteGenerator /></ProtectedRoute>} />
        <Route path="/flashcard-generator" element={<ProtectedRoute><FlashcardGenerator /></ProtectedRoute>} />
        <Route path="/quiz-generator" element={<ProtectedRoute><QuizGenerator /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
