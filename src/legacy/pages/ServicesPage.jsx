import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaTools, FaStar, FaMapMarkerAlt, FaFilter, FaCalendar, FaUser, FaClock, FaDollarSign } from 'react-icons/fa';
import { getCategories, getWorkerServices } from '../api';
import './ServicesPage.css';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState(['Все категории']);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [sortBy, setSortBy] = useState('По умолчанию');
  const location = useLocation();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [loading, setLoading] = useState(true);

  const sortOptions = ['По умолчанию', 'Цена: по возрастанию', 'Цена: по убыванию', 'Рейтинг', 'Отклики'];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [cats, servicesData] = await Promise.all([getCategories(), getWorkerServices()]);

        const adaptedServices = (servicesData || []).map((item) => ({
          id: item.id,
          title: item.title || 'Услуга мастера',
          description: item.description || 'Описание услуги не указано',
          price: item.priceFrom || item.priceTo || 0,
          category: 'Услуги',
          categorySlug: 'remont-kvartir',
          masterName: `Мастер`,
          masterRating: 4.7,
          masterReviews: item.createdAt ? 5 : 0,
          location: 'Йошкар-Ола',
          responseTime: '30 мин',
          image: 'https://via.placeholder.com/300x200/74b9ff/ffffff?text=Услуга',
          workerUserId: item.workerUserId,
        }));

        const uniqueCategories = ['Все категории', ...new Set(adaptedServices.map(s => s.category))];

        setServices(adaptedServices);
        setCategories(uniqueCategories);
        setFilteredServices(adaptedServices);
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    if (q && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [location.search]);

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
                      <div className="service-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            if (service.categorySlug) {
                              navigate(`/categories/${service.categorySlug}`);
                            } else {
                              navigate('/sections');
                            }
                          }}
                        >
                          Заказать работу
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => navigate(`/chat/${service.id}`)}
                        >
                          Написать мастеру
                        </button>
                      </div>
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
