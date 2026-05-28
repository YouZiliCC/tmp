import { Route, Routes } from "react-router-dom";
import Masthead from "./components/Masthead";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import TraditionalSearch from "./pages/TraditionalSearch";
import SmartSearch from "./pages/SmartSearch";
import PaperDetail from "./pages/PaperDetail";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Masthead />
      <NavBar />
      <main className="flex-1 max-w-column w-full mx-auto px-6 pt-10 pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<TraditionalSearch />} />
          <Route path="/smart" element={<SmartSearch />} />
          <Route path="/paper/:id" element={<PaperDetail />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
