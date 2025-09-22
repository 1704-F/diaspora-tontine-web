// @/components/ui/Select.jsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

// Context pour partager l'état entre les composants
const SelectContext = React.createContext();

// Hook pour utiliser le context
const useSelect = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within Select');
  }
  return context;
};

// Composant Select principal
const Select = ({ 
  children, 
  value, 
  onValueChange, 
  defaultValue,
  disabled = false,
  required = false,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  const [selectedLabel, setSelectedLabel] = useState('');
  const selectRef = useRef(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synchroniser avec la prop value
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue, label) => {
    setSelectedValue(newValue);
    setSelectedLabel(label);
    setIsOpen(false);
    onValueChange?.(newValue);
  };

  const contextValue = {
    isOpen,
    setIsOpen,
    selectedValue,
    selectedLabel,
    setSelectedLabel,
    handleValueChange,
    disabled,
    required,
    name
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Trigger (bouton qui ouvre le select)
const SelectTrigger = React.forwardRef(({ 
  className = '', 
  children,
  placeholder = "Sélectionner...",
  ...props 
}, ref) => {
  const { isOpen, setIsOpen, disabled, selectedValue } = useSelect();

  return (
    <button
      ref={ref}
      type="button"
      className={`
        flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
        bg-white px-3 py-2 text-sm text-left
        placeholder:text-gray-500 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:cursor-not-allowed disabled:opacity-50
        ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}
      `}
      onClick={() => !disabled && setIsOpen(!isOpen)}
      disabled={disabled}
      {...props}
    >
      <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
        {children || placeholder}
      </span>
      <ChevronDownIcon 
        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

// Value (affiche la valeur sélectionnée)
const SelectValue = ({ placeholder = "Sélectionner..." }) => {
  const { selectedLabel, selectedValue } = useSelect();
  
  return (
    <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
      {selectedLabel || placeholder}
    </span>
  );
};

// Content (conteneur du dropdown)
const SelectContent = ({ 
  className = '', 
  children,
  position = 'bottom',
  ...props 
}) => {
  const { isOpen } = useSelect();

  if (!isOpen) return null;

  return (
    <div
      className={`
        absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg
        max-h-60 overflow-auto
        animate-in fade-in-0 zoom-in-95
        ${position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}
        ${className}
      `}
      {...props}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

// Item (option du select)
const SelectItem = ({ 
  value, 
  children, 
  className = '',
  disabled = false,
  ...props 
}) => {
  const { selectedValue, handleValueChange, setSelectedLabel } = useSelect();
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (!disabled) {
      handleValueChange(value, children);
    }
  };

  // Enregistrer le label quand l'item est monté et qu'il est sélectionné
  useEffect(() => {
    if (isSelected && children) {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);

  return (
    <div
      className={`
        relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm
        hover:bg-gray-100 focus:bg-gray-100
        ${isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={handleClick}
      {...props}
    >
      {isSelected && (
        <CheckIcon className="h-4 w-4 mr-2 text-blue-600" />
      )}
      <span className={isSelected ? 'ml-0' : 'ml-6'}>
        {children}
      </span>
    </div>
  );
};

// Group (pour grouper les options)
const SelectGroup = ({ children, className = '' }) => {
  return (
    <div className={`py-1 ${className}`}>
      {children}
    </div>
  );
};

// Label pour les groupes
const SelectLabel = ({ children, className = '' }) => {
  return (
    <div className={`px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${className}`}>
      {children}
    </div>
  );
};

// Separator
const SelectSeparator = ({ className = '' }) => {
  return (
    <div className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} />
  );
};

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator
};