import React from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Signup from './components/Signup'
import Chat from './components/Chat'

const PrivateRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/chat" 
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/chat" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App