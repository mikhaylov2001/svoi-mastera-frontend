import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <Link className="logo" to="/">
        СвоиМастера
      </Link>
      <div className="nav-links">
        <NavLink to="/" end>
          Главная
        </NavLink>
        <NavLink to="/categories">
          Категории
        </NavLink>
        <NavLink to="/deals">
          Мои сделки
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
