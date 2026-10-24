import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps<T = string | number> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export function CustomSelect<T extends string | number = string>({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  size = 'md',
  className = '',
  style,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isSmall ? '5px 10px' : '8px 12px',
          backgroundColor: isOpen ? '#0e0f14' : '#08080a',
          border: isOpen
            ? '1px solid var(--color-accent-primary, #6366f1)'
            : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-sm, 6px)',
          color: selectedOption ? '#ffffff' : 'var(--color-text-muted, #71717a)',
          fontSize: isSmall ? '11px' : '12px',
          fontFamily: 'inherit',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(99, 102, 241, 0.18)' : 'none',
          transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
          opacity: disabled ? 0.5 : 1,
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
          {selectedOption?.icon && (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{selectedOption.icon}</span>
          )}
          <span
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 600,
              color: selectedOption ? '#ffffff' : 'var(--color-text-muted, #71717a)',
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.subLabel && (
            <span
              style={{
                fontSize: isSmall ? '10px' : '11px',
                color: 'var(--color-text-muted, #71717a)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              ({selectedOption.subLabel})
            </span>
          )}
        </div>

        <ChevronDown
          size={isSmall ? 13 : 14}
          style={{
            color: 'var(--color-text-secondary, #a1a1aa)',
            transition: 'transform 180ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
            marginLeft: '8px',
          }}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            backgroundColor: '#0a0b0e',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 'var(--radius-sm, 6px)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px',
            animation: 'fadeIn 0.12s ease-out',
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={String(option.value)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isSmall ? '6px 8px' : '8px 10px',
                  borderRadius: '4px',
                  fontSize: isSmall ? '11px' : '12px',
                  color: isSelected ? '#ffffff' : '#a1a1aa',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 100ms ease, color 100ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#a1a1aa';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  {option.icon && (
                    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{option.icon}</span>
                  )}
                  <span style={{ fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap' }}>
                    {option.label}
                  </span>
                  {option.subLabel && (
                    <span style={{ fontSize: isSmall ? '10px' : '11px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {option.subLabel}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check size={13} color="var(--color-accent-primary, #6366f1)" style={{ flexShrink: 0, marginLeft: '8px' }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
