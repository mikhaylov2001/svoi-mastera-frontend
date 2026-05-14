import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CUSTOMER_HOME_PATH, WORKER_HOME_PATH } from '../constants/homePaths';
import './Navbar.css';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Navbar() {
  const { userId, userName, userRole } = useAuth();
  const displayName = userName || 'Гость';
  const roleLabel = !userId ? 'Не авторизован' : userRole === 'WORKER' ? 'Мастер' : 'Заказчик';
  const initials = getInitials(displayName);

  const homePath = userRole === 'WORKER' ? WORKER_HOME_PATH : CUSTOMER_HOME_PATH;

  return (
    <nav className="navbar">
      <Link className="logo" to={homePath}>
        СвоиМастера
      </Link>

          <div className="nav-center">
            <NavLink to={homePath} end>
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
          <div className="user-name">{displayName}</div>
          <div className="user-role">{roleLabel}</div>
        </div>
        <div className="user-avatar">{initials}</div>
      </div>
    </nav>
  );
}

export default Navbar;
