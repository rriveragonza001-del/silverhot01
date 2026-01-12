
import React from 'react';
import { Promoter } from '../types';

interface TrackingMapProps {
  promoters: Promoter[];
}

const TrackingMap: React.FC<TrackingMapProps> = ({ promoters }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[600px] flex flex-col">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Mapa de Seguimiento en Tiempo Real</h2>
          <p className="text-sm text-slate-500">Ubicación actual de los promotores activos</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1 bg-green-500 rounded-full animate-pulse"></span>
            {promoters.filter(p => p.status === 'active').length} Activos
          </span>
        </div>
      </div>
      
      <div className="flex-1 relative bg-slate-100 overflow-hidden">
        {/* Mock Map Background using a Grid and SVG Elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
        
        {/* Stylized Simulated Map View */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 600">
          <path d="M0,300 Q250,100 500,300 T1000,300" fill="none" stroke="#e2e8f0" strokeWidth="100" />
          <path d="M300,0 Q500,250 300,600" fill="none" stroke="#e2e8f0" strokeWidth="80" />
        </svg>

        {/* Promoter Markers */}
        {promoters.map((promoter, index) => {
          // Calculate mock positions based on lat/lng or indices for demo
          const x = 100 + (index * 250);
          const y = 150 + (index * 120);
          
          return (
            <div 
              key={promoter.id}
              className="absolute transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-full border-4 ${promoter.status === 'active' ? 'border-green-500' : 'border-amber-500'} bg-white shadow-xl overflow-hidden`}>
                  <img src={promoter.photo} alt={promoter.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500"></div>
                
                {/* Tooltip on hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white p-3 rounded-lg shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  <p className="font-bold text-sm text-slate-800">{promoter.name}</p>
                  <p className="text-xs text-slate-500 truncate mb-1">{promoter.lastLocation.address}</p>
                  <div className="flex items-center text-[10px] text-slate-400">
                    <i className="fa-solid fa-clock mr-1"></i>
                    <span>Hace 2 mins</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend / Status Bar */}
      <div className="p-4 bg-white border-t border-slate-100 flex gap-4 overflow-x-auto">
        {promoters.map(p => (
          <div key={p.id} className="flex items-center space-x-3 min-w-max p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
            <img src={p.photo} alt={p.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
            <div>
              <p className="text-sm font-semibold text-slate-700 leading-none">{p.name}</p>
              <p className="text-xs text-slate-400 mt-1">{p.lastLocation.address}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackingMap;
