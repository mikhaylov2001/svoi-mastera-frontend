import React, { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaClock, FaMapMarkerAlt, FaFilter, FaStar, FaBriefcase, FaBullseye } from 'react-icons/fa';
import { getCategories } from '../api';
import './ActiveClientsPage.css';

// Моковые данные активных клиентов
const mockActiveClients = [
  {
    id: 1,
    name: 'Елена Петрова',
    category: 'Мебель',
    title: 'Сборка кухонного гарнитура',
    description: 'Нужно собрать кухню из ИКЕА, 12 модулей. Работа на этой неделе.',
    budget: '5000-8000 ₽',
    location: 'Йошкар-Ола, Центр',
    postedTime: '2 часа назад',
    urgency: 'Срочно',
    responses: 3,
    rating: 4.8
  },
  {
    id: 2,
    name: 'Александр Иванов',
    category: 'Сантехника',
    title: 'Замена смесителя в ванной',
    description: 'Течет старый смеситель, нужно установить новый. Есть свой смеситель.',
    budget: '1500-2500 ₽',
    location: 'Йошкар-Ола, Ленинский',
    postedTime: '5 часов назад',
    urgency: 'Средняя',
    responses: 7,
    rating: 4.5
  },
  {
    id: 3,
    name: 'Мария Сидорова',
    category: 'Электрика',
    title: 'Установка розеток в комнате',
    description: 'Нужно установить 4 розетки и 1 выключатель. Провода уже есть.',
    budget: '2000-3000 ₽',
    location: 'Йошкар-Ола, Московский',
    postedTime: '1 день назад',
    urgency: 'Низкая',
    responses: 12,
    rating: 4.9
  },
  {
    id: 4,
    name: 'Дмитрий Кузнецов',
    category: 'Строительство',
    title: 'Ремонт балкона',
    description: 'Нужно остеклить и отделать балкон. Площадь 6 кв.м.',
    budget: '15000-25000 ₽',
    location: 'Йошкар-Ола, Семёновский',
    postedTime: '3 дня назад',
    urgency: 'Средняя',
    responses: 5,
    rating: 4.7
  },
  {
    id: 5,
    name: 'Ольга Новикова',
    category: 'Уборка',
    title: 'Генеральная уборка квартиры',
    description: 'Нужно убрать 2-комнатную квартиру после ремонта. 45 кв.м.',
    budget: '3000-5000 ₽',
    location: 'Йошкар-Ола, Лесозавод',
    postedTime: '1 неделю назад',
    urgency: 'Низкая',
    responses: 18,
    rating: 4.6
  }
];

const categories = ['Все категории', 'Мебель', 'Сантехника', 'Электрика', 'Строительство', 'Уборка', 'Компьютеры', 'Бытовая техника'];
const urgencyLevels = ['Все уровни', 'Срочно', 'Средняя', 'Низкая'];

export default function ActiveClientsPage() {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [categories, setCategories] = useState(['Все категории']);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Все категории');
    const [selectedUrgency, setSelectedUrgency] = useState('Все уровни');
    const [sortBy, setSortBy] = useState('По умолчанию');
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(true);

    const sortOptions = ['По умолчанию', 'Бюджет: по возрастанию', 'Бюджет: по убыванию', 'Рейтинг', 'Срочно'];

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Загружаем категории
                const categoriesData = await getCategories();
                const categoryNames = categoriesData.map(cat => cat.name);
                
                // Моковые данные для демонстрации
                const uniqueCategories = ['Все категории', ...new Set(mockActiveClients.map(c => c.category))];
                
                setClients(mockActiveClients);
                setCategories(uniqueCategories);
                setFilteredClients(mockActiveClients);
            } catch (error) {
                console.error('Ошибка загрузки клиентов:', error);
                // Используем моковые данные при ошибке
                const uniqueCategories = ['Все категории', ...new Set(mockActiveClients.map(c => c.category))];
                setClients(mockActiveClients);
                setCategories(uniqueCategories);
                setFilteredClients(mockActiveClients);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        let filtered = clients;

        // Фильтрация по категории
        if (selectedCategory !== 'Все категории') {
            filtered = filtered.filter(client => client.category === selectedCategory);
        }

        // Фильтрация по срочности
        if (selectedUrgency !== 'Все уровни') {
            filtered = filtered.filter(client => client.urgency === selectedUrgency);
        }

        // Фильтрация по поиску
        if (searchTerm) {
            filtered = filtered.filter(client =>
                client.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Сортировка
        switch (sortBy) {
            case 'Бюджет: по возрастанию':
                filtered = [...filtered].sort((a, b) => {
                    const aMin = parseInt(a.budget.split('-')[0].replace(/[^\d]/g, ''));
                    const bMin = parseInt(b.budget.split('-')[0].replace(/[^\d]/g, ''));
                    return aMin - bMin;
                });
                break;
            case 'Бюджет: по убыванию':
                filtered = [...filtered].sort((a, b) => {
                    const aMin = parseInt(a.budget.split('-')[0].replace(/[^\d]/g, ''));
                    const bMin = parseInt(b.budget.split('-')[0].replace(/[^\d]/g, ''));
                    return bMin - aMin;
                });
                break;
            case 'Рейтинг':
                filtered = [...filtered].sort((a, b) => b.rating - a.rating);
                break;
            case 'Срочно':
                const urgencyOrder = { 'Срочно': 1, 'Средняя': 2, 'Низкая': 3 };
                filtered = [...filtered].sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
                break;
            default:
                break;
        }

        setFilteredClients(filtered);
    }, [clients, searchTerm, selectedCategory, selectedUrgency, sortBy]);

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'Срочно': return '#dc2626';
            case 'Средняя': return '#f59e0b';
            case 'Низкая': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <div>
            <div className="page-header-bar">
                <div className="container">
                    <h1><FaUser /> Активные клиенты</h1>
                    <p>Находите заказы от клиентов в вашей категории</p>
                </div>
            </div>

            <div className="container">
                {/* Фильтры и поиск */}
                <div className="clients-filters">
                    <div className="search-section">
                        <div className="search-input-wrapper">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Поиск заказов, клиентов..."
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
                            value={selectedUrgency}
                            onChange={(e) => setSelectedUrgency(e.target.value)}
                            className="filter-select"
                        >
                            {urgencyLevels.map(level => (
                                <option key={level} value={level}>{level}</option>
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

                {/* Результаты поиска */}
                <div className="clients-results">
                    <div className="results-count">
                        Найдено заказов: {filteredClients.length}
                    </div>

                    {loading ? (
                        <div className="loading-clients">
                            <div className="loading-spinner"></div>
                            <p>Загрузка заказов...</p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="no-results">
                            <FaBriefcase className="no-results-icon" />
                            <h3>Заказы не найдены</h3>
                            <p>Попробуйте изменить параметры поиска или фильтры</p>
                        </div>
                    ) : (
                        <div className="clients-grid">
                            {filteredClients.map(client => (
                                <div key={client.id} className="client-card">
                                    <div className="client-header">
                                        <div className="client-info">
                                            <div className="client-name">{client.name}</div>
                                            <div className="client-rating">
                                                <FaStar className="star-icon" />
                                                {client.rating}
                                            </div>
                                        </div>
                                        <div className="client-meta">
                                            <div className="client-category">{client.category}</div>
                                            <div 
                                                className="client-urgency" 
                                                style={{ backgroundColor: getUrgencyColor(client.urgency) }}
                                            >
                                                {client.urgency}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="client-content">
                                        <h3 className="client-title">{client.title}</h3>
                                        <p className="client-description">{client.description}</p>
                                        
                                        <div className="client-details">
                                            <div className="detail-item">
                                                <FaMapMarkerAlt className="detail-icon" />
                                                <span>{client.location}</span>
                                            </div>
                                            <div className="detail-item">
                                                <FaClock className="detail-icon" />
                                                <span>{client.postedTime}</span>
                                            </div>
                                            <div className="detail-item">
                                                <FaBriefcase className="detail-icon" />
                                                <span>{client.responses} откликов</span>
                                            </div>
                                        </div>

                                        <div className="client-budget">
                                            <span className="budget-label">Бюджет:</span>
                                            <span className="budget-amount">{client.budget}</span>
                                        </div>
                                    </div>

                                    <div className="client-footer">
                                        <button className="btn btn-primary">
                                            Откликнуться
                                        </button>
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
