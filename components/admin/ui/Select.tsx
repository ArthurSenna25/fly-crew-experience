'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

type Option = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

interface SelectProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
}

export default function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecionar...',
  className = '',
  disabled = false,
  onFocus,
  onBlur,
  style,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Reduced motion hook
  const useReducedMotion = () => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
      const check = () => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      };
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setEnabled(mq.matches);
      const handler = (e: MediaQueryListEvent) => setEnabled(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }, []);
    return enabled;
  };
  const reducedMotion = useReducedMotion();

  // Position for portal dropdown
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  // Update position while open
  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close on outside click (trigger or menu)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const triggerContains = inputRef.current && inputRef.current.contains(event.target as Node);
      const menuContains = menuRef.current && menuRef.current.contains(event.target as Node);
      if (!triggerContains && !menuContains) {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Highlight first option when opening
  useEffect(() => {
    if (isOpen) {
      const firstEnabledIndex = options.findIndex((opt) => !opt.disabled);
      setHighlightedIndex(firstEnabledIndex >= 0 ? firstEnabledIndex : 0);
    }
  }, [isOpen, options]);

  // Scroll to highlighted option
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && menuRef.current) {
      const optionsRefs = Array.from(menuRef.current.querySelectorAll('[role="option"]'));
      const optionEl = optionsRefs[highlightedIndex] as HTMLElement;
      if (optionEl) {
        const listbox = menuRef.current.querySelector('[role="listbox"]') as HTMLElement;
        if (listbox) {
          const scrollTop = optionEl.offsetTop - listbox.offsetTop;
          listbox.scrollTop = scrollTop;
        }
      }
    }
  }, [isOpen, highlightedIndex]);

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const selectOption = (option: Option) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        toggleOpen();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => {
          const index = prev - 1;
          if (index < 0) return options.length - 1;
          return index;
        });
        break;
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => {
          const index = prev + 1;
          if (index >= options.length) return 0;
          return index;
        });
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const highlightedOption = options[highlightedIndex];
        if (highlightedOption && !highlightedOption.disabled) {
          selectOption(highlightedOption);
        }
        break;
      default:
        break;
    }
  };

  // FIX: getOptionValue/getOptionIcon continuam existindo (não usados mais
  // diretamente no JSX do trigger, ver abaixo), mantidos caso algo externo
  // dependa deles — mas o bug estava em como eram combinados no render.
  const getOptionValue = () => {
    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const getOptionIcon = () => {
    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption?.icon;
  };

  // Portal root element (created/destroyed in effect)
  const portalRoot = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!isOpen) {
      if (portalRoot.current) {
        document.body.removeChild(portalRoot.current);
        portalRoot.current = null;
      }
      return;
    }
    const div = document.createElement('div');
    portalRoot.current = div;
    document.body.appendChild(div);
    return () => {
      if (portalRoot.current) {
        document.body.removeChild(portalRoot.current);
        portalRoot.current = null;
      }
    };
  }, [isOpen]);

  // Render portal content
  const portalContent = position ? (
    <motion.div className="glass-scrollbar"
      initial={reducedMotion ? undefined : { scale: 0.95, opacity: 0 }}
      animate={reducedMotion ? undefined : { scale: 1, opacity: 1 }}
      exit={reducedMotion ? undefined : { scale: 0.95, opacity: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.2,
        ease: [0.16, 1, 0.3, 1],
      }}
      // Modal (Level 4) styling from DESIGN-ADMIN.md
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        marginTop: 0, // space below trigger
        background: 'rgba(14,14,14,0.85)',
        backdropFilter: 'blur(40px) saturate(1.5)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderTop: '1px solid rgba(255,255,255,0.20)',
        borderRadius: '20px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        zIndex: 2000,
        maxHeight: '200px',
        overflowY: 'auto',
        outline: 'none',
      }}
    >
      <div role="listbox" id={`${listboxId}-listbox`} ref={menuRef}>
        {options.map((option, index) => (
          <div
            key={option.value}
            role="option"
            aria-selected={option.value === value}
            aria-disabled={option.disabled}
            onClick={() => selectOption(option)}
            onMouseEnter={() => setHighlightedIndex(index)}
            className={`flex items-center gap-2 px-3 py-2 text-[0.875rem] text-[#F7F7F5] cursor-pointer
              ${highlightedIndex === index && !option.disabled ? 'bg-white/10' : ''}
              ${option.value === value ? 'bg-white/5' : ''}
              transition-colors duration-150 ease-out
              ${option.disabled ? 'text-[#6B7280]/50 cursor-not-allowed' : ''}
              ${option.className ?? ''}`}
            style={option.style}
          >
            {option.icon && <div className="flex-shrink-0">{option.icon}</div>}
            <span className="flex-1">{option.label}</span>
            {option.value === value && (
              <div className="flex-shrink-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 13L9 17L19 7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.8}
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  ) : null;

  return (
    <div
      ref={inputRef}
      id={listboxId}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label && (
        <label className="text-[0.65rem] text-[#AEB7C1] uppercase tracking-[0.1em] mb-1">
          {label}
        </label>
      )}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${listboxId}-listbox`}
        tabIndex={disabled ? -1 : 0}
        onClick={toggleOpen}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full relative flex items-center gap-2 text-[0.875rem] text-[#F7F7F5] px-3 py-2 outline-none
          focus:ring-2 focus:ring-white/10
          transition-colors duration-150 ease-out"
        style={{
          // Input defaults from DESIGN-ADMIN.md
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          borderRadius: '10px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          ...style,
          ...(disabled && {
            background: 'rgba(255,255,255,0.02)',
            color: '#6B7280',
            cursor: 'not-allowed',
          }),
        }}
      >
        {/*
          FIX: era `{getOptionIcon() || <span>{getOptionValue()}</span>}`.
          Com esse `||`, sempre que a opção selecionada tinha um `icon`
          (Prioridade e Status de Leitura têm; Tags não passa por aqui),
          o texto era descartado inteiro e só o ícone aparecia — por isso
          a caixa "ficava vazia" visualmente. Agora ícone e texto sempre
          renderizam juntos.
        */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {getOptionIcon() && <span className="flex-shrink-0">{getOptionIcon()}</span>}
          <span className="flex-1 truncate">{getOptionValue()}</span>
        </div>
        <div className="flex-shrink-0">
          <ChevronDown
            className="w-4 h-4 text-[#AEB7C1]/50 transition-transform duration-150 ease-out"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </div>

      {/* Portal to body */}
      {isOpen && portalRoot.current ? createPortal(portalContent, portalRoot.current) : null}
    </div>
  );
}
