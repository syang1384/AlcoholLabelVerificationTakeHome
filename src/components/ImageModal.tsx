'use client'

import { useEffect, useState } from 'react'

interface ImageModalProps {
  isOpen: boolean
  imageSrc: string | null
  onClose: () => void
}

export default function ImageModal({ isOpen, imageSrc, onClose }: ImageModalProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3))
  }
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5))
  }
  
  const handleZoomReset = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  if (!isOpen || !imageSrc) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Zoom controls */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <button
            onClick={handleZoomOut}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-lg"
            title="Zoom out"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleZoomReset}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 px-3 py-2 rounded-lg text-sm font-medium"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-lg"
            title="Zoom in"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
        {/* Instructions */}
        {zoom > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 px-4 py-2 rounded-lg text-sm">
            Click and drag to pan
          </div>
        )}
        
        {/* Image */}
        <div
          className="overflow-hidden max-w-full max-h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            src={imageSrc}
            alt="Zoomed label"
            className="select-none"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain'
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
