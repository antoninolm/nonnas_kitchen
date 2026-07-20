import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Experiences from "./pages/Experiences.jsx";
import ExperienceDetail from "./pages/ExperienceDetail.jsx";
import HostProfile from "./pages/HostProfile.jsx";
import HostNew from "./pages/HostNew.jsx";
import HostExperienceNew from "./pages/HostExperienceNew.jsx";
import HostExperienceEdit from "./pages/HostExperienceEdit.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import HostManage from "./pages/HostManage.jsx";
import Profile from "./pages/Profile.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import BookingsSuccess from "./pages/BookingsSuccess.jsx";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/experiences" element={<Experiences />} />
        <Route path="/experiences/:id" element={<ExperienceDetail />} />
        <Route
          path="/hosts/new"
          element={
            <RequireAuth>
              <HostNew />
            </RequireAuth>
          }
        />
        <Route path="/hosts/:id" element={<HostProfile />} />
        <Route
          path="/hosts/:id/experiences/new"
          element={
            <RequireAuth>
              <HostExperienceNew />
            </RequireAuth>
          }
        />
        <Route
          path="/hosts/:id/experiences/:experienceId/edit"
          element={
            <RequireAuth>
              <HostExperienceEdit />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard/hosts/:id"
          element={
            <RequireAuth>
              <HostManage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/users/:id"
          element={
            <RequireAuth>
              <UserProfile />
            </RequireAuth>
          }
        />
        <Route path="/bookings/success" element={<BookingsSuccess />} />
      </Routes>
    </>
  );
}

export default App;
