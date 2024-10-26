import React, { useContext } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';  // Assuming you have this context set up

const ProtectedRoute = ({ element: Component, ...rest }) => {
    const { user } = useContext(AuthContext);

    return (
        <Route
            {...rest}
            element={user ? Component : <Navigate to="/login" />}
        />
    );
};

export default ProtectedRoute;
