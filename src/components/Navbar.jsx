import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

const MOCK_USER = {
  name: 'Дмитрий',
  role: 'Клиент',
};

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Navbar() {
  const initials = getInitials(MOCK_USER.name);

  return (
    <nav className="navbar">
      <Link className="logo" to="/">
        СвоиМастера
      </Link>

          <div className="nav-center">
            <NavLink to="/" end>
              Главная
            </NavLink>
            <NavLink to="/categories">
              Категории
            </NavLink>
            <NavLink to="/deals">
              Мои сделки
            </NavLink>
            <NavLink to="/profile">
              Профиль
            </NavLink>
          </div>

      <div className="nav-user">
        <div className="user-info">
          <div className="user-name">{MOCK_USER.name}</div>
          <div className="user-role">{MOCK_USER.role}</div>
        </div>
        <div className="user-avatar">{initials}</div>
      </div>
    </nav>
  );
}

export default Navbar;
