import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Experiences from "./pages/Experiences.jsx";
import ExperienceDetail from "./pages/ExperienceDetail.jsx";

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
      </Routes>
    </>
  );
}

export default App;
