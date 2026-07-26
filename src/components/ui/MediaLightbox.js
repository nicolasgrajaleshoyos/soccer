'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function MediaLightbox({ media }) {
  const [activeIdx, setActiveIdx] = useState(null);

  const openLightbox = (idx) => {
    setActiveIdx(idx);
  };

  const closeLightbox = () => {
    setActiveIdx(null);
  };

  const nextMedia = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % media.length);
  };

  const prevMedia = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + media.length) % media.length);
  };

  return (
    <div className="space-y-6">
      {media.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          Este álbum está vacío. Aún no se han subido fotos ni videos.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {media.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => openLightbox(idx)}
              className="glass-card overflow-hidden h-40 relative group cursor-pointer border border-slate-800"
            >
              {item.type === 'image' ? (
                <div 
                  className="w-full h-full bg-cover bg-center transition-all group-hover:scale-105 duration-300"
                  style={{ backgroundImage: `url(${item.url})` }}
                />
              ) : (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-900 transition-colors">
                  <Play className="h-10 w-10 text-emerald-400 opacity-80" />
                  <span className="text-[10px] text-slate-500 mt-2">Video</span>
                </div>
              )}

              {/* Hover caption overlay */}
              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3">
                <p className="text-[10px] text-slate-200 truncate">{item.caption || 'Ver archivo'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal (cristal premium) */}
      {activeIdx !== null && (
        <div 
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          {/* Close button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-all"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation Controls */}
          {media.length > 1 && (
            <>
              <button 
                onClick={prevMedia}
                className="absolute left-6 p-3 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={nextMedia}
                className="absolute right-6 p-3 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Content Wrapper */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[80vh] w-full flex flex-col items-center gap-4"
          >
            {media[activeIdx].type === 'image' ? (
              <img 
                src={media[activeIdx].url} 
                alt={media[activeIdx].caption || 'Imagen'} 
                className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl border border-slate-800/60"
              />
            ) : (
              <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-black border border-slate-800">
                {/* Simulated video playback or generic player */}
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                  <Play className="h-16 w-16 text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Reproduciendo: {media[activeIdx].caption || 'Video de partido'}</p>
                  <p className="text-xs text-slate-500">Ruta de origen: {media[activeIdx].url}</p>
                </div>
              </div>
            )}
            
            {media[activeIdx].caption && (
              <p className="text-sm text-slate-300 font-semibold text-center max-w-lg mt-2">
                {media[activeIdx].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
