import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import DealsPage from './pages/DealsPage';
import ProfilePage from './pages/ProfilePage'; // НОВОЕ
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/profile" element={<ProfilePage />} /> {/* НОВОЕ */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
