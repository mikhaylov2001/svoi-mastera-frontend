import React, { useState, useEffect } from 'react';
import { FaSearch, FaTools, FaStar, FaMapMarkerAlt, FaFilter, FaCalendar, FaUser, FaClock, FaDollarSign } from 'react-icons/fa';
import { getCategories } from '../api';
import './ServicesPage.css';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState(['Все категории']);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [sortBy, setSortBy] = useState('По умолчанию');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [loading, setLoading] = useState(true);

  const sortOptions = ['По умолчанию', 'Цена: по возрастанию', 'Цена: по убыванию', 'Рейтинг', 'Отклики'];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Загружаем услуги мастеров (пока используем моковые данные, так как API для всех услуг может не существовать)
        // В реальном приложении здесь будет вызов API для получения всех услуг мастеров
        
        // Моковые данные для демонстрации
        const mockServices = [
          {
            id: 1,
            title: 'Сборка мебели',
            description: 'Профессиональная сборка любой мебели: кухни, шкафы, кровати. Гарантия качества.',
            price: 1500,
            category: 'Мебель',
            masterName: 'Александр Иванов',
            masterRating: 4.8,
            masterReviews: 127,
            location: 'Йошкар-Ола, Центр',
            responseTime: '15 мин',
            image: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=Сборка+мебели',
            tags: ['Гарантия', 'Опыт 5+ лет', 'Выезд']
          },
          {
            id: 2,
            title: 'Ремонт сантехники',
            description: 'Установка и ремонт сантехники: трубы, смесители, унитазы. Круглосуточно.',
            price: 2000,
            category: 'Сантехника',
            masterName: 'Михаил Петров',
            masterRating: 4.9,
            masterReviews: 89,
            location: 'Йошкар-Ола, Ленинский',
            responseTime: '30 мин',
            image: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=Сантехника',
            tags: ['Круглосуточно', 'Гарантия', 'Опыт 10+ лет']
          },
          {
            id: 3,
            title: 'Электромонтажные работы',
            description: 'Полный комплекс электромонтажных работ: проводка, розетки, освещение.',
            price: 1800,
            category: 'Электрика',
            masterName: 'Дмитрий Сидоров',
            masterRating: 4.7,
            masterReviews: 156,
            location: 'Йошкар-Ола, Московский',
            responseTime: '45 мин',
            image: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=Электрика',
            tags: ['Лицензия', 'Гарантия', 'Материалы']
          },
          {
            id: 4,
            title: 'Ремонт компьютеров',
            description: 'Диагностика и ремонт компьютеров и ноутбуков. Выезд на дом.',
            price: 1200,
            category: 'Компьютеры',
            masterName: 'Елена Козлова',
            masterRating: 4.9,
            masterReviews: 203,
            location: 'Йошкар-Ола, Семёновский',
            responseTime: '20 мин',
            image: 'https://via.placeholder.com/300x200/9b59b6/ffffff?text=Компьютеры',
            tags: ['Выезд', 'Гарантия', 'Срочно']
          },
          {
            id: 5,
            title: 'Клининг помещений',
            description: 'Профессиональная уборка квартир и офисов. Качественная химия.',
            price: 1000,
            category: 'Уборка',
            masterName: 'Ольга Новикова',
            masterRating: 4.6,
            masterReviews: 94,
            location: 'Йошкар-Ола, Лесозавод',
            responseTime: '1 час',
            image: 'https://via.placeholder.com/300x200/1abc9c/ffffff?text=Уборка',
            tags: ['Экология', 'Качество', 'Инвентарь']
          },
          {
            id: 6,
            title: 'Ремонт стиральных машин',
            description: 'Диагностика и ремонт стиральных машин всех марок. Гарантия на работы.',
            price: 1700,
            category: 'Бытовая техника',
            masterName: 'Игорь Смирнов',
            masterRating: 4.8,
            masterReviews: 178,
            location: 'Йошкар-Ола, Центр',
            responseTime: '25 мин',
            image: 'https://via.placeholder.com/300x200/e67e22/ffffff?text=Стиральные+машины',
            tags: ['Гарантия', 'Запчасти', 'Выезд']
          }
        ];

        // Получаем уникальные категории из услуг
        const uniqueCategories = ['Все категории', ...new Set(mockServices.map(s => s.category))];
        
        setServices(mockServices);
        setCategories(uniqueCategories);
        setFilteredServices(mockServices);
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = services;

    // Фильтрация по категории
    if (selectedCategory !== 'Все категории') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    // Фильтрация по поиску
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.masterName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтрация по цене
    filtered = filtered.filter(service =>
      service.price >= priceRange.min && service.price <= priceRange.max
    );

    // Сортировка
    switch (sortBy) {
      case 'Цена: по возрастанию':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'Цена: по убыванию':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'Рейтинг':
        filtered = [...filtered].sort((a, b) => b.masterRating - a.masterRating);
        break;
      case 'Отклики':
        filtered = [...filtered].sort((a, b) => b.masterReviews - a.masterReviews);
        break;
      default:
        break;
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory, sortBy, priceRange]);

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1><FaTools /> Услуги мастеров</h1>
          <p>Найдите подходящего мастера для вашей задачи</p>
        </div>
      </div>

      <div className="container">
        {/* Фильтры и поиск */}
        <div className="services-filters">
          <div className="search-section">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Поиск услуг, мастеров..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filters-section">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              {sortOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>

            <button 
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Фильтры
            </button>
          </div>
        </div>

        {/* Расширенные фильтры */}
        {showFilters && (
          <div className="advanced-filters">
            <div className="price-filter">
              <label>Диапазон цены:</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="От"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: parseInt(e.target.value) || 0})}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="До"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value) || 5000})}
                />
                <span>₽</span>
              </div>
            </div>
          </div>
        )}

        {/* Результаты поиска */}
        <div className="services-results">
          <div className="results-count">
            Найдено услуг: {filteredServices.length}
          </div>

          {loading ? (
            <div className="loading-services">
              <div className="loading-spinner"></div>
              <p>Загрузка услуг...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="no-results">
              <FaTools className="no-results-icon" />
              <h3>Услуги не найдены</h3>
              <p>Попробуйте изменить параметры поиска или фильтры</p>
            </div>
          ) : (
            <div className="services-grid">
              {filteredServices.map(service => (
                <div key={service.id} className="service-card">
                  <div className="service-image">
                    <img src={service.image} alt={service.title} />
                    <div className="service-category">{service.category}</div>
                  </div>
                  
                  <div className="service-content">
                    <h3 className="service-title">{service.title}</h3>
                    <p className="service-description">{service.description}</p>
                    
                    <div className="service-tags">
                      {service.tags.map((tag, index) => (
                        <span key={index} className="service-tag">{tag}</span>
                      ))}
                    </div>

                    <div className="service-master">
                      <div className="master-info">
                        <FaUser className="master-icon" />
                        <div>
                          <div className="master-name">{service.masterName}</div>
                          <div className="master-rating">
                            <FaStar className="star-icon" />
                            {service.masterRating} ({service.masterReviews} отзывов)
                          </div>
                        </div>
                      </div>
                      
                      <div className="master-meta">
                        <div className="location">
                          <FaMapMarkerAlt /> {service.location}
                        </div>
                        <div className="response-time">
                          <FaClock /> Отклик {service.responseTime}
                        </div>
                      </div>
                    </div>

                    <div className="service-footer">
                      <div className="service-price">
                        <FaDollarSign />
                        {service.price} <span className="price-unit">/ услуга</span>
                      </div>
                      <button className="btn btn-primary">
                        Заказать
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
