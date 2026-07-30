"use client";

import { useState, useRef, useEffect } from "react";
import { Tag as TagIcon, X, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  compact?: boolean; // backward compatibility: if true, maxVisible=2 unless maxVisible is set
  maxVisible?: number; // overrides compact; default behavior: compact? 2 : 3
  placeholder?: string;
}

export default function TagSelector({
  availableTags = [],
  selectedTags = [],
  onChange,
  compact = false,
  maxVisible,
  placeholder = "Adicionar tag",
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Custom hook to check for reduced motion preference
  const useReducedMotion = () => {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
      const check = () => {
        if (typeof window === "undefined") return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      };
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setEnabled(mq.matches);
      const handler = (e: MediaQueryListEvent) => setEnabled(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }, []);
    return enabled;
  };

  const reducedMotion = useReducedMotion();

  // Compute actual maxVisible: if maxVisible is provided, use it; else, use compact? 2 : 3
  const actualMaxVisible = maxVisible ?? (compact ? 2 : 3);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(""); // Reset search when closing
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  const getTagColor = (tagName: string) => {
    const tag = availableTags.find((t) => t.name === tagName);
    return tag ? tag.color : "#6B72868e96"; // fallback to slate-500
  };

  // Filter tags based on search term
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Selecionar tags"
      className="relative"
    >
      {/* Selected tags container */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex flex-wrap gap-1 items-center cursor-pointer"
      >
        {/* Visible selected chips (limited by actualMaxVisible) */}
        {selectedTags.slice(0, actualMaxVisible).map((tagName) => {
          const tagColor = getTagColor(tagName);
          return (
            <span
              key={tagName}
              className={`inline-flex items-center gap-2 px-2 py-0.5 rounded
                bg-[${tagColor}]/15
                text-[${tagColor}]
                border border-[${tagColor}]/25
                text-[0.7rem] font-medium`}
            >
              <TagIcon className="w-3 h-3" aria-hidden="true" />
              {tagName}
              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(selectedTags.filter((t) => t !== tagName));
                }}
                className="ml-1 text-current opacity-60 hover:opacity-100
                  transition-opacity duration-150 ease-out
                  w-3 h-3 flex-shrink-0"
                aria-label={`Remover tag ${tagName}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        {/* Overflow indicator: "+N more" */}
        {selectedTags.length > actualMaxVisible && (
          <span
            key="overflow"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
              bg-[#AEB7C1]/10
              text-[#AEB7C1]
              text-[0.65rem]
              border border-[#AEB7C1]/20"
          >
            +{selectedTags.length - actualMaxVisible} mais
          </span>
        )}

        {/* Add tag button when we haven't reached maxVisible */}
        {selectedTags.length < actualMaxVisible && (
          <button
            type="button"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded
              text-[${getTagColor(selectedTags[0] || "")}]/60
              border border-dashed
              border-[#AEB7C1]/20
              hover:text-[#AEB7C1]
              hover:border-[#AEB7C1]/40
              transition-colors duration-150 ease-out`}
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            {selectedTags.length === 0 ? placeholder : ""}
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={
              // Reduced motion: skip animation entirely
              false ? { opacity: 0, y: -4, scale: 0.98 } : { opacity: 0, y: -4, scale: 0.98 }
            }
            animate={false ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={false ? { opacity: 0, y: -4, scale: 0.98 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{
              duration: false ? 0 : 0.15,
              ease: false ? "linear" : "easeOut",
            }}
            className="absolute z-50 mt-1 left-0 min-w-[180px]
              bg-[#1A1A1A]
              border border-[#1B1B1B]
              rounded
              shadow-lg
              shadow-black/40
              p-1"
            style={{ pointerEvents: "none" }} // Prevents events during animation
          >
            <div className="pointer-auto">
              {/* Search input */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar tags..."
                className="w-full bg-transparent border-b border-[#1B1B1B] pb-2 mb-1
                  text-[0.8rem] text-[#F7F7F5]
                  placeholder:text-[#AEB7C1]/40
                  outline-none
                  px-2 py-1"
              />

              {/* Tags list */}
              <div className="glass-scrollbar flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {filteredTags.length === 0 ? (
                  <p className="w-full px-2 py-3 text-[0.75rem] text-[#AEB7C1]/60 text-center">
                    Nenhuma tag encontrada
                  </p>
                ) : (
                  filteredTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => toggleTag(tag.name)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded
                          cursor-pointer
                          text-[0.8rem] text-[#F7F7F5]
                          hover:bg-[#111111]
                          transition-colors duration-100 ease-out`}
                      >
                        {/* Color dot */}
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                          aria-hidden="true"
                        />
                        {/* Tag name */}
                        <span className="flex-1">{tag.name}</span>
                        {/* Checkmark when selected */}
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}