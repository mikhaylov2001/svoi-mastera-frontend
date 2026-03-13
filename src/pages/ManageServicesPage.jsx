import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTools, FaStar, FaMapMarkerAlt, FaClock, FaDollarSign, FaSave, FaTimes } from 'react-icons/fa';
import { getMyWorkerServices, createWorkerService, updateWorkerService, deleteWorkerService } from '../api';
import { useAuth } from '../context/AuthContext';
import './ManageServicesPage.css';

const categories = ['Мебель', 'Строительство', 'Электрика', 'Сантехника', 'Компьютеры', 'Уборка', 'Бытовая техника'];

export default function ManageServicesPage() {
  const { userId } = useAuth();
  const [services, setServices] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Мебель',
    experience: '',
    warranty: '',
    location: 'Йошкар-Ола',
    tags: []
  });

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await getMyWorkerServices(userId);
        setServices(data || []);
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadServices();
    }
  }, [userId]);

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      category: 'Мебель',
      experience: '',
      warranty: '',
      location: 'Йошкар-Ола',
      tags: []
    });
    setShowAddModal(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      price: service.price,
      category: service.category,
      experience: service.experience,
      warranty: service.warranty,
      location: service.location,
      tags: service.tags || []
    });
    setShowAddModal(true);
  };

  const handleSaveService = async () => {
    if (!formData.title || !formData.price) return;

    try {
      setSaving(true);
      const serviceData = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        experience: formData.experience,
        warranty: formData.warranty,
        location: formData.location,
        tags: formData.tags
      };

      if (editingService) {
        // Обновляем существующую услугу
        await updateWorkerService(userId, editingService.id, serviceData);
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...serviceData } : s));
      } else {
        // Создаем новую услугу
        const newService = await createWorkerService(userId, serviceData);
        setServices([...services, { ...newService, isActive: true }]);
      }

      setShowAddModal(false);
      setEditingService(null);
      } catch (error) {
      console.error('Ошибка сохранения услуги:', error);
      alert('Не удалось сохранить услугу. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту услугу?')) return;

    try {
      await deleteWorkerService(userId, id);
      setServices(services.filter(s => s.id !== id));
    } catch (error) {
      console.error('Ошибка удаления услуги:', error);
      alert('Не удалось удалить услугу. Попробуйте ещё раз.');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const service = services.find(s => s.id === id);
      await updateWorkerService(userId, id, { active: !service.isActive });
      setServices(services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    } catch (error) {
      console.error('Ошибка изменения статуса услуги:', error);
      alert('Не удалось изменить статус услуги. Попробуйте ещё раз.');
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, e.target.value.trim()]
      });
      e.target.value = '';
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, index) => index !== indexToRemove)
    });
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="container">
          <h1><FaTools /> Мои услуги</h1>
          <p>Управляйте своими услугами и привлекайте клиентов</p>
        </div>
      </div>

      <div className="container">
        <div className="manage-services-header">
          <div className="services-stats">
            <div className="stat-item">
              <span className="stat-number">{services.length}</span>
              <span className="stat-label">Всего услуг</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{services.filter(s => s.isActive).length}</span>
              <span className="stat-label">Активные</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{services.filter(s => !s.isActive).length}</span>
              <span className="stat-label">Неактивные</span>
            </div>
          </div>
          
          <button className="btn btn-primary" onClick={handleAddService}>
            <FaPlus /> Добавить услугу
          </button>
        </div>

        {loading ? (
          <div className="loading-services">
            <div className="loading-spinner"></div>
            <p>Загрузка услуг...</p>
          </div>
        ) : (
          <div className="services-list">
            {services.length === 0 ? (
              <div className="empty-services">
                <FaTools className="empty-icon" />
                <h3>У вас пока нет услуг</h3>
                <p>Добавьте свою первую услугу, чтобы начать привлекать клиентов</p>
                <button className="btn btn-primary" onClick={handleAddService}>
                  <FaPlus /> Добавить услугу
                </button>
              </div>
            ) : (
              services.map(service => (
                <div key={service.id} className={`service-item ${!service.isActive ? 'inactive' : ''}`}>
                  <div className="service-image">
                    <img src={service.image} alt={service.title} />
                    <div className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                      {service.isActive ? 'Активна' : 'Неактивна'}
                    </div>
                  </div>

                  <div className="service-content">
                    <div className="service-header">
                      <h3 className="service-title">{service.title}</h3>
                      <div className="service-actions">
                        <button 
                          className="btn-icon btn-edit"
                          onClick={() => handleEditService(service)}
                          title="Редактировать"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteService(service.id)}
                          title="Удалить"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <p className="service-description">{service.description}</p>

                    <div className="service-details">
                      <div className="detail-item">
                        <FaDollarSign className="detail-icon" />
                        <span>{service.price} ₽ / услуга</span>
                      </div>
                      <div className="detail-item">
                        <FaTools className="detail-icon" />
                        <span>{service.category}</span>
                      </div>
                      <div className="detail-item">
                        <FaMapMarkerAlt className="detail-icon" />
                        <span>{service.location}</span>
                      </div>
                      <div className="detail-item">
                        <FaClock className="detail-icon" />
                        <span>Опыт: {service.experience}</span>
                      </div>
                    </div>

                    <div className="service-tags">
                      {service.tags && service.tags.map((tag, index) => (
                        <span key={index} className="service-tag">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="service-sidebar">
                    <button 
                      className={`toggle-btn ${service.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(service.id)}
                    >
                      {service.isActive ? 'Деактивировать' : 'Активировать'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Модальное окно добавления/редактирования */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingService ? 'Редактировать услугу' : 'Добавить услугу'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Название услуги *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Например: Сборка мебели"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Описание *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Подробно опишите вашу услугу..."
                  rows="4"
                  className="form-textarea"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Цена (₽) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="1500"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Категория</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="form-select"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Опыт работы</label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    placeholder="Например: 5 лет"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Гарантия</label>
                  <input
                    type="text"
                    value={formData.warranty}
                    onChange={(e) => setFormData({...formData, warranty: e.target.value})}
                    placeholder="Например: 12 месяцев"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Местоположение</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Йошкар-Ола"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Теги (нажмите Enter для добавления)</label>
                <div className="tags-input-container">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag-item">
                      {tag}
                      <button 
                        type="button" 
                        className="tag-remove"
                        onClick={() => handleRemoveTag(index)}
                      >
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Добавить тег..."
                    onKeyDown={handleAddTag}
                    className="tag-input"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={handleSaveService} disabled={saving}>
                <FaSave /> {saving ? 'Сохранение...' : (editingService ? 'Сохранить' : 'Добавить')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
