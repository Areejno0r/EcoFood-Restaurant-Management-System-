import React, { useState, useEffect } from 'react';
import { Users, Wifi, Music, Car, Eye, Star, TreePine, Home, X, MapPin, CheckCircle } from 'lucide-react';
import { Table } from '../types/api.types';
import './RestaurantLayout.css';

interface RestaurantLayoutProps {
  availableTables: Table[];
  selectedTable: Table | null;
  onTableSelect: (table: Table) => void;
  onTableDetails?: (tableId: number) => void;
  disableInternalModal?: boolean; // New prop to disable internal preview modal
}

interface TablePosition {
  table_id: number;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

const RestaurantLayout: React.FC<RestaurantLayoutProps> = ({
  availableTables,
  selectedTable,
  onTableSelect,
  onTableDetails,
  disableInternalModal = false
}) => {
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  const [showTablePreview, setShowTablePreview] = useState<Table | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'list'>('3d');

  // Define table positions based on location and dynamically assign positions
  const getTablePosition = (table: Table, index: number): TablePosition => {
    const basePositions = {
      indoor: [
        { x: 25, y: 30, rotation: 0, width: 12, height: 8 },
        { x: 45, y: 30, rotation: 0, width: 12, height: 8 },
        { x: 65, y: 30, rotation: 0, width: 12, height: 8 },
        { x: 25, y: 50, rotation: 0, width: 12, height: 8 },
        { x: 45, y: 50, rotation: 0, width: 12, height: 8 },
        { x: 65, y: 50, rotation: 0, width: 12, height: 8 }
      ],
      window: [
        { x: 11, y: 30, rotation: 0, width: 8, height: 6 },
        { x: 11, y: 45, rotation: 0, width: 8, height: 6 },
        { x: 11, y: 60, rotation: 0, width: 8, height: 6 },
        { x: 11, y: 75, rotation: 0, width: 8, height: 6 }
      ],
      outdoor: [
        { x: 85, y: 20, rotation: 0, width: 10, height: 6 },
        { x: 85, y: 35, rotation: 0, width: 10, height: 6 },
        { x: 85, y: 50, rotation: 0, width: 10, height: 6 },
        { x: 85, y: 65, rotation: 0, width: 10, height: 6 },
        { x: 85, y: 80, rotation: 0, width: 10, height: 6 }
      ],
      private: [
        { x: 20, y: 75, rotation: 0, width: 15, height: 10 },
        { x: 45, y: 75, rotation: 0, width: 15, height: 10 },
        { x: 70, y: 75, rotation: 0, width: 15, height: 10 }
      ]
    };

    const locationPositions = basePositions[table.location] || basePositions.indoor;
    const positionIndex = index % locationPositions.length;
    const basePosition = locationPositions[positionIndex];

    return {
      table_id: table.table_id,
      ...basePosition
    };
  };

  // Group tables by location for dynamic positioning
  const tablesByLocation = availableTables.reduce((acc, table) => {
    if (!acc[table.location]) {
      acc[table.location] = [];
    }
    acc[table.location].push(table);
    return acc;
  }, {} as Record<string, Table[]>);



  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'indoor': return <Home className="w-3 h-3" />;
      case 'outdoor': return <TreePine className="w-3 h-3" />;
      case 'window': return <Eye className="w-3 h-3" />;
      case 'private': return <Star className="w-3 h-3" />;
      default: return <Home className="w-3 h-3" />;
    }
  };

  const getLocationBadgeClass = (location: string): string => {
    switch (location) {
      case 'indoor': return 'location-badge-indoor';
      case 'outdoor': return 'location-badge-outdoor';
      case 'window': return 'location-badge-window';
      case 'private': return 'location-badge-private';
      default: return 'location-badge-default';
    }
  };

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'indoor': return '#3b82f6';
      case 'outdoor': return '#10b981';
      case 'window': return '#f59e0b';
      case 'private': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="restaurant-layout">
      <div className="layout-header">
        <p>Click on any available table to select it</p>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button 
          onClick={() => setViewMode('3d')}
          className={`toggle-btn ${viewMode === '3d' ? 'active' : ''}`}
        >
          <Eye className="w-4 h-4" />
          3D Floor Plan
        </button>
        <button 
          onClick={() => setViewMode('list')}
          className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
        >
          <Users className="w-4 h-4" />
          List View
        </button>
      </div>

      <div className="layout-container">
        {viewMode === '3d' ? (
          /* Restaurant Floor Plan SVG */
          <svg viewBox="0 0 100 100" className="restaurant-svg">
          {/* Restaurant Walls */}
          <rect x="5" y="15" width="90" height="70" 
                fill="none" stroke="#e5e7eb" strokeWidth="0.5" 
                rx="2" className="restaurant-boundary" />
          
          {/* Indoor Section */}
          <rect x="20" y="20" width="55" height="45" 
                fill="rgba(59, 130, 246, 0.05)" stroke="#3b82f6" 
                strokeWidth="0.3" strokeDasharray="1,1" rx="1" />
          <text x="37" y="22" textAnchor="middle" className="location-label">Indoor Dining</text>
          
          {/* Window Side */}
          <rect x="5" y="20" width="12" height="50" 
                fill="rgba(245, 158, 11, 0.05)" stroke="#f59e0b" 
                strokeWidth="0.3" strokeDasharray="1,1" rx="1" />
          <text x="11" y="18" textAnchor="middle" className="location-label">Window</text>
          
          {/* Outdoor Terrace */}
          <rect x="80" y="15" width="15" height="55" 
                fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" 
                strokeWidth="0.3" strokeDasharray="1,1" rx="1" />
          <text x="87" y="13" textAnchor="middle" className="location-label">Outdoor</text>
          
          {/* Private Rooms */}
          <rect x="15" y="70" width="70" height="20" 
                fill="rgba(139, 92, 246, 0.05)" stroke="#8b5cf6" 
                strokeWidth="0.3" strokeDasharray="1,1" rx="1" />
          <text x="60" y="85" textAnchor="middle" className="location-label">Private Dining</text>

          {/* Kitchen Area */}
          <rect x="20" y="88" width="25" height="7" 
                fill="#f3f4f6" stroke="#9ca3af" strokeWidth="0.3" rx="1" />
          <text x="32" y="92" textAnchor="middle" className="facility-label">Kitchen</text>

          

          {/* Entrance */}
          <rect x="56" y="15" width="6" height="3" 
                fill="#10b981" stroke="#059669" strokeWidth="0.3" rx="0.5" />
          <text x="59" y="13" textAnchor="middle" className="facility-label">Entrance</text>

          {/* Render Tables */}
          {availableTables.map((table, tableIndex) => {
            // Get position for table based on its location and index within that location
            const locationIndex = tablesByLocation[table.location]?.findIndex(t => t.table_id === table.table_id) || 0;
            const position = getTablePosition(table, locationIndex);



            const isSelected = selectedTable?.table_id === table.table_id;
            const isHovered = hoveredTable === table.table_id;
            const tableColor = getLocationColor(table.location);

            return (
              <g key={table.table_id} 
                 className={`table-group ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                 transform={`translate(${position.x}, ${position.y}) rotate(${position.rotation})`}
                 onClick={() => {
                   if (disableInternalModal) {
                     onTableSelect(table);
                   } else {
                     setShowTablePreview(table);
                   }
                 }}
                 onMouseEnter={() => setHoveredTable(table.table_id)}
                 onMouseLeave={() => setHoveredTable(null)}>
                
                {/* Table Surface */}
                <rect x={-position.width/2} y={-position.height/2} 
                      width={position.width} height={position.height}
                      fill={isSelected ? tableColor : 'white'}
                      stroke={tableColor}
                      strokeWidth={isSelected ? "0.8" : "0.4"}

                      rx="1"
                      className="table-surface" />

                {/* Table Number - Commented out as per user request */}
                {/* 
                <text x="0" y="1" textAnchor="middle" 
                      className={`table-number ${isSelected ? 'selected' : ''}`}>
                  {table.table_number}
                </text>
                */}

                {/* Capacity Indicator - Uncommenting to bring back */}
                
                <circle cx="0" cy="-2.5" r="1.5" 
                        fill={tableColor} 
                        className="capacity-indicator" />
                <text x="0" y="-1.5" textAnchor="middle" 
                      className="capacity-text">
                  {table.capacity}
                </text>
                

                

                {/* Chair Indicators */}
                {Array.from({ length: Math.min(table.capacity, 8) }, (_, i) => {
                  const angle = (i * 360) / Math.min(table.capacity, 8);
                  const chairRadius = Math.max(position.width, position.height) / 2 + 1.5;
                  const chairX = Math.cos((angle - 90) * Math.PI / 180) * chairRadius;
                  const chairY = Math.sin((angle - 90) * Math.PI / 180) * chairRadius;
                  
                  return (
                    <rect key={i}
                          x={chairX - 0.5} y={chairY - 0.5}
                          width="1" height="1"
                          fill="#6b7280"
                          rx="0.2"
                          className="chair" />
                  );
                })}
              </g>
            );
                      })}
          </svg>
        ) : (
          /* List View */
          <div className="tables-list-view">
            {availableTables.map((table) => (
              <div 
                key={table.table_id}
                className={`table-list-item ${selectedTable?.table_id === table.table_id ? 'selected' : ''}`}
                onClick={() => {
                  if (disableInternalModal) {
                    onTableSelect(table);
                  } else {
                    setShowTablePreview(table);
                  }
                }}
              >
                <div className="table-list-header">
                  <div className="table-list-number">
                    {getLocationIcon(table.location)}
                    <span>Table {table.table_number}</span>
                  </div>
                  <div 
                    className={`table-list-location-badge ${getLocationBadgeClass(table.location)}`}
                  >
                    {table.location_display}
                  </div>
                </div>
                <div className="table-list-details">
                  <div className="table-list-capacity">
                    <Users className="w-4 h-4" />
                    <span>Up to {table.capacity} guests</span>
                  </div>
                  {table.description && (
                    <p className="table-list-description">{table.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Table Info Panel - Enhanced with full details */}
        {selectedTable && (
          <div className="selected-table-info">
            <div className="table-info-header">
              <div className="table-info-title">
                {getLocationIcon(selectedTable.location)}
                <span>Table {selectedTable.table_number}</span>
              </div>
              <div 
                className={`location-badge-enhanced ${getLocationBadgeClass(selectedTable.location)}`}
                style={{ backgroundColor: getLocationColor(selectedTable.location) }}
              >
                {selectedTable.location_display}
              </div>
            </div>
            
            <div className="table-info-details-enhanced">
              <div className="detail-section">
                <div className="detail-item-enhanced">
                  <Users className="w-5 h-5" />
                  <div>
                    <strong>Capacity</strong>
                    <p>Perfect for up to {selectedTable.capacity} guests</p>
                  </div>
                </div>
                
                <div className="detail-item-enhanced">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <strong>Location</strong>
                    <p>{selectedTable.location_display} seating area</p>
                  </div>
                </div>
                
                {selectedTable.description && (
                  <div className="detail-item-enhanced">
                    <Star className="w-5 h-5" />
                    <div>
                      <strong>Description</strong>
                      <p>{selectedTable.description}</p>
                    </div>
                  </div>
                )}
                
                <div className="table-features-section">
                  <h4>Features & Amenities</h4>
                  <div className="features-grid-enhanced">
                    {getTableFeatures(selectedTable.location).map((feature, idx) => (
                      <div key={idx} className="feature-item-enhanced">
                        <CheckCircle className="w-4 h-4" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="layout-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Indoor Dining</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Window Side</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
            <span>Outdoor Terrace</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span>Private Rooms</span>
          </div>
        </div>
      </div>

      {/* Table Preview & Confirmation Modal */}
      {showTablePreview && !disableInternalModal && (
        <div className="modal-overlay" onClick={() => setShowTablePreview(null)}>
          <div className="table-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <div className="preview-title">
                {getLocationIcon(showTablePreview.location)}
                <h3>Table {showTablePreview.table_number}</h3>
              </div>
              <button onClick={() => setShowTablePreview(null)} className="preview-close">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="preview-content">
              <div className="table-preview-visual">
                <div className="mini-table" style={{ backgroundColor: getLocationColor(showTablePreview.location) }}>
                  <span className="mini-table-number">{showTablePreview.table_number}</span>
                  <div className="mini-capacity">{showTablePreview.capacity}</div>
                </div>
                
                <div className="preview-location">
                  <span 
                    className={`location-badge-large ${getLocationBadgeClass(showTablePreview.location)}`}
                  >
                    {getLocationIcon(showTablePreview.location)}
                    {showTablePreview.location_display}
                  </span>
                </div>
              </div>
              
              <div className="table-details-expanded">
                <div className="detail-item">
                  <Users className="w-5 h-5" />
                  <div>
                    <strong>Capacity</strong>
                    <p>Perfect for up to {showTablePreview.capacity} guests</p>
                  </div>
                </div>
                
                <div className="detail-item">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <strong>Location</strong>
                    <p>{showTablePreview.location_display} seating area</p>
                  </div>
                </div>
                
                {showTablePreview.description && (
                  <div className="detail-item">
                    <Star className="w-5 h-5" />
                    <div>
                      <strong>Description</strong>
                      <p>{showTablePreview.description}</p>
                    </div>
                  </div>
                )}
                
                <div className="table-features-expanded">
                  <h4>Features & Amenities</h4>
                  <div className="features-list">
                    {getTableFeatures(showTablePreview.location).map((feature, idx) => (
                      <div key={idx} className="feature-item">
                        <CheckCircle className="w-4 h-4" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="preview-actions">
              <button 
                onClick={() => setShowTablePreview(null)}
                className="btn-secondary"
              >
                Browse More Tables
              </button>
              <button
                onClick={() => {
                  onTableSelect(showTablePreview);
                  setShowTablePreview(null);
                }}
                className="btn-primary btn-confirm"
              >
                <CheckCircle className="w-5 h-5" />
                Select This Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get table features
const getTableFeatures = (location: string): string[] => {
  switch (location) {
    case 'indoor':
      return ['Air Conditioning', 'Comfortable Seating', 'Wi-Fi', 'Background Music', 'Privacy'];
    case 'outdoor':
      return ['Fresh Air', 'Garden View', 'Natural Light', 'Romantic Ambiance', 'Al Fresco Dining'];
    case 'window':
      return ['Street View', 'Natural Light', 'People Watching', 'Cozy Atmosphere', 'City Views'];
    case 'private':
      return ['Complete Privacy', 'Dedicated Service', 'Custom Music', 'Special Occasions', 'VIP Treatment'];
    default:
      return ['Comfortable Seating', 'Great Service', 'Perfect Ambiance'];
  }
};

export default RestaurantLayout; 