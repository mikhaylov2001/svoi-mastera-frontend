import React, { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaClock, FaMapMarkerAlt, FaFilter, FaStar, FaBriefcase, FaBullseye } from 'react-icons/fa';
import { getOpenJobRequests, getCategories } from '../api';
import { useAuth } from '../context/AuthContext';
import './ActiveClientsPage.css';

const categories = ['Все категории', 'Мебель', 'Сантехника', 'Электрика', 'Строительство', 'Уборка', 'Компьютеры', 'Бытовая техника'];
const urgencyLevels = ['Все уровни', 'Срочно', 'Средняя', 'Низкая'];

export default function ActiveClientsPage() {
    const { userId } = useAuth();
    const [jobRequests, setJobRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [categories, setCategories] = useState(['Все категории']);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Все категории');
    const [selectedUrgency, setSelectedUrgency] = useState('Все уровни');
    const [sortBy, setSortBy] = useState('По умолчанию');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const sortOptions = ['По умолчанию', 'Бюджет: по возрастанию', 'Бюджет: по убыванию', 'Новые'];

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError('');
                
                // Загружаем открытые заявки
                const requestsData = await getOpenJobRequests();
                
                // Загружаем категории
                const categoriesData = await getCategories();
                const categoryNames = ['Все категории', ...categoriesData.map(cat => cat.name)];
                
                setJobRequests(requestsData || []);
                setCategories(categoryNames);
                setFilteredRequests(requestsData || []);
            } catch (error) {
                console.error('Ошибка загрузки заказов:', error);
                setError(error.message || 'Не удалось загрузить заказы');
                setJobRequests([]);
                setFilteredRequests([]);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadData();
        }
    }, [userId]);

    useEffect(() => {
        let filtered = jobRequests;

        // Фильтрация по категории
        if (selectedCategory !== 'Все категории') {
            filtered = filtered.filter(request => {
                // Ищем категорию по названию
                return request.categoryName === selectedCategory;
            });
        }

        // Фильтрация по поиску
        if (searchTerm) {
            filtered = filtered.filter(request =>
                request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Сортировка
        switch (sortBy) {
            case 'Бюджет: по возрастанию':
                filtered = [...filtered].sort((a, b) => (a.budgetTo || 0) - (b.budgetTo || 0));
                break;
            case 'Бюджет: по убыванию':
                filtered = [...filtered].sort((a, b) => (b.budgetTo || 0) - (a.budgetTo || 0));
                break;
            case 'Новые':
                filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            default:
                break;
        }

        setFilteredRequests(filtered);
    }, [jobRequests, searchTerm, selectedCategory, sortBy]);

    const handleOfferResponse = async (requestId) => {
        // Здесь будет логика отклика на заказ
        console.log('Отклик на заказ:', requestId);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
            return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'} назад`;
        } else if (diffHours > 0) {
            return `${diffHours} ${diffHours === 1 ? 'час' : diffHours < 5 ? 'часа' : 'часов'} назад`;
        } else {
            return 'Только что';
        }
    };

    const getUrgencyColor = (budget) => {
        if (!budget) return '#6b7280';
        const budgetNum = parseInt(budget.toString().replace(/[^\d]/g, ''));
        if (budgetNum < 2000) return '#dc2626'; // Срочно - маленький бюджет
        if (budgetNum < 5000) return '#f59e0b'; // Средняя
        return '#10b981'; // Низкая - большой бюджет
    };

    const getUrgencyLabel = (budget) => {
        if (!budget) return 'Не указана';
        const budgetNum = parseInt(budget.toString().replace(/[^\d]/g, ''));
        if (budgetNum < 2000) return 'Срочно';
        if (budgetNum < 5000) return 'Средняя';
        return 'Низкая';
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
                {error && (
                    <div className="error-message" style={{ 
                        background: '#fef2f2', 
                        border: '1px solid #fecaca', 
                        color: '#dc2626', 
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        marginBottom: '16px' 
                    }}>
                        {error}
                    </div>
                )}

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
                        Найдено заказов: {filteredRequests.length}
                    </div>

                    {loading ? (
                        <div className="loading-clients">
                            <div className="loading-spinner"></div>
                            <p>Загрузка заказов...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="no-results">
                            <FaBriefcase className="no-results-icon" />
                            <h3>Заказы не найдены</h3>
                            <p>Попробуйте изменить параметры поиска или фильтры</p>
                        </div>
                    ) : (
                        <div className="clients-grid">
                            {filteredRequests.map(request => (
                                <div key={request.id} className="client-card">
                                    <div className="client-header">
                                        <div className="client-info">
                                            <div className="client-name">{request.customerName || 'Клиент'}</div>
                                            <div className="client-rating">
                                                <FaStar className="star-icon" />
                                                {request.customerRating || '0.0'}
                                            </div>
                                        </div>
                                        <div className="client-meta">
                                            <div className="client-category">{request.categoryName || 'Без категории'}</div>
                                            <div 
                                                className="client-urgency" 
                                                style={{ backgroundColor: getUrgencyColor(request.budgetTo) }}
                                            >
                                                {getUrgencyLabel(request.budgetTo)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="client-content">
                                        <h3 className="client-title">{request.title}</h3>
                                        <p className="client-description">{request.description}</p>
                                        
                                        <div className="client-details">
                                            <div className="detail-item">
                                                <FaMapMarkerAlt className="detail-icon" />
                                                <span>{request.addressText || 'Адрес не указан'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <FaClock className="detail-icon" />
                                                <span>{formatDate(request.createdAt)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <FaBriefcase className="detail-icon" />
                                                <span>{request.offerCount || 0} откликов</span>
                                            </div>
                                        </div>

                                        <div className="client-budget">
                                            <span className="budget-label">Бюджет:</span>
                                            <span className="budget-amount">
                                                {request.budgetTo ? `${request.budgetTo} ₽` : 'Не указан'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="client-footer">
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => handleOfferResponse(request.id)}
                                        >
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
