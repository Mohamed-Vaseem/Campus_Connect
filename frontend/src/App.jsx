import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './lib/auth';
import { Spinner } from './components/ui';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';

const MyTickets = lazy(() => import('./pages/MyTickets'));
const Points = lazy(() => import('./pages/Points'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EventForm = lazy(() => import('./pages/EventForm'));
const ManageEvent = lazy(() => import('./pages/ManageEvent'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Records = lazy(() => import('./pages/Records'));

function Guard({ roles, children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="center" style={{ padding: 80 }}><Spinner size={30} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  if (user.role === 'STUDENT' && !user.profileComplete && loc.pathname !== '/welcome') {
    return <Navigate to="/welcome" state={{ from: loc.pathname }} replace />;
  }
  return children;
}

const ADMIN = ['ADMIN'];

export default function App() {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main key={location.pathname.split('/').slice(0, 3).join('/')}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
          <Suspense fallback={<div className="center" style={{ padding: 80 }}><Spinner size={30} /></div>}>
            <Routes location={location}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />

              <Route path="/welcome" element={<Guard roles={['STUDENT']}><Welcome /></Guard>} />
              <Route path="/tickets" element={<Guard roles={['STUDENT']}><MyTickets /></Guard>} />
              <Route path="/points" element={<Guard roles={['STUDENT']}><Points /></Guard>} />
              <Route path="/profile" element={<Guard><Profile /></Guard>} />
              <Route path="/notifications" element={<Guard><Notifications /></Guard>} />

              <Route path="/admin" element={<Guard roles={ADMIN}><AdminDashboard /></Guard>} />
              <Route path="/admin/events/new" element={<Guard roles={ADMIN}><EventForm /></Guard>} />
              <Route path="/admin/events/:id/edit" element={<Guard roles={ADMIN}><EventForm /></Guard>} />
              <Route path="/admin/events/:id" element={<Guard roles={ADMIN}><ManageEvent /></Guard>} />
              <Route path="/admin/records" element={<Guard roles={ADMIN}><Records /></Guard>} />
              <Route path="/analytics" element={<Guard roles={ADMIN}><Analytics /></Guard>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
}
