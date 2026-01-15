import type React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./context/AuthContext"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import About from "./pages/About"
import Benefits from "./pages/Benefits"
import Contact from "./pages/Contact"
import Partnership from "./pages/Partnership"
import OurPartnerships from "./pages/OurPartnerships"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Onboarding from "./pages/Onboarding"
import Admin from "./pages/Admin"
import AdminLogin from "./pages/AdminLogin"

// Componente para rotas protegidas que requerem autenticação
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Routes>
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/benefits" element={<Benefits />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/partnership" element={<Partnership />} />
                    <Route path="/our-partnerships" element={<OurPartnerships />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <Onboarding />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App

