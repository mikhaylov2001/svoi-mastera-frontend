import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="hero">
      <h1>Найди своего мастера</h1>
      <p>Размещай заявки, получай отклики и выбирай лучшего специалиста.</p>
      <Link className="btn" to="/categories">Смотреть категории</Link>
    </div>
  );
}

export default HomePage;
