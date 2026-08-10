import { type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import PortalLayout from './components/PortalLayout';
import AppLayout from './components/AppLayout';
import Home from './pages/portal/Home';
import FindHealthcare from './pages/portal/FindHealthcare';
import FacilityProfile from './pages/portal/FacilityProfile';
import Login from './pages/portal/Login';
import ContentPage from './pages/portal/ContentPage';
import Dashboard from './pages/app/Dashboard';
import Queue from './pages/app/Queue';
import Patients from './pages/app/Patients';
import PatientDetail from './pages/app/PatientDetail';
import Register from './pages/app/Register';
import Appointments from './pages/app/Appointments';
import Admin from './pages/app/Admin';
import Pharmacy from './pages/app/Pharmacy';
import Lab from './pages/app/Lab';
import Stock from './pages/app/Stock';
import Referrals from './pages/app/Referrals';
import Immunizations from './pages/app/Immunizations';
import Beds from './pages/app/Beds';
import Ambulances from './pages/app/Ambulances';
import BloodBank from './pages/app/BloodBank';
import Theatre from './pages/app/Theatre';
import Directorate from './pages/app/Directorate';
import RegisterFacility from './pages/portal/RegisterFacility';
import PatientHome from './pages/patient/PatientHome';

function RequireStaff({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Checking session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.scope === 'PATIENT') return <Navigate to="/patient" replace />;
  return <>{children}</>;
}

function RequirePatient({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Checking session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.scope !== 'PATIENT') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/find-healthcare" element={<FindHealthcare />} />
        <Route path="/facilities" element={<Navigate to="/find-healthcare" replace />} />
        <Route path="/facilities/:id" element={<FacilityProfile />} />
        <Route path="/health-information" element={<ContentPage title="Health Information" body="Health education content is published through the content management workflow and subject to authorized clinical review (spec §77)." />} />
        <Route path="/news" element={<ContentPage title="News & Announcements" body="Facility and national announcements are published by authorized administrators." />} />
        <Route path="/contact" element={<ContentPage title="Contact" body="Please use the facility directory to find verified contact details for specific facilities. Emergency numbers are only ever displayed from configured facility data — never fabricated." />} />
        <Route path="/register-facility" element={<RegisterFacility />} />
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        path="/app"
        element={
          <RequireStaff>
            <AppLayout />
          </RequireStaff>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="queue" element={<Queue />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="register" element={<Register />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="pharmacy" element={<Pharmacy />} />
        <Route path="lab" element={<Lab />} />
        <Route path="stock" element={<Stock />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="immunizations" element={<Immunizations />} />
        <Route path="beds" element={<Beds />} />
        <Route path="ambulances" element={<Ambulances />} />
        <Route path="bloodbank" element={<BloodBank />} />
        <Route path="theatre" element={<Theatre />} />
        <Route path="directorate" element={<Directorate />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      <Route
        path="/patient"
        element={
          <RequirePatient>
            <PatientHome />
          </RequirePatient>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
