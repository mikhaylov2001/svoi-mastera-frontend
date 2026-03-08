import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <Link className="logo" to="/">СвоиМастера</Link>
      <div className="nav-links">
        <Link to="/">Главная</Link>
        <Link to="/categories">Категории</Link>
        <Link to="/deals">Мои сделки</Link>
      </div>
    </nav>
  );
}

export default Navbar;
