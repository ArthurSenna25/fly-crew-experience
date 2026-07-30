'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Tag as TagIcon, Edit2, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { TAG_COLORS } from "@/lib/admin-utils";
import Select from "@/components/admin/ui/Select";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// ─── Types ────────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface TagManagerProps {
  tags: Tag[];
  onRefresh: () => void;
}

// ─── Design Tokens from DESIGN-ADMIN.md ───────────────────────────────────

// Colors
const COLORS = {
  // Base
  deepBlack: "#0A0A0A",           // Base (fundo)
  surfaceLow: "#111111",          // Superfície 1
  surfaceMid: "#161616",          // Superfície 2
  surfaceHigh: "#1C1C1E",         // Superfície 3

  // Glass
  glassWhite: "rgba(255,255,255,0.06)",   // Glass
  glassEdge: "rgba(255,255,255,0.12)",    // Glass Border
  glassTop: "rgba(255,255,255,0.08)",     // Glass Highlight

  // Text
  cloudWhite: "#F7F7F5",          // Texto primário
  silverMist: "#AEB7C1",          // Texto secundário
  dim: "#6B7280",                 // Texto terciário

  // Structural & Accent
  midnightPremium: "#0B1F33",     // Marca estrutural
  goldPrestige: "#D4AF37",        // Acento crítico

  // Status
  success: "#10B981",             // Status Sucesso
  error: "#F87171",               // Status Erro
  warning: "#FBBF24",             // Status Alerta
  info: "#60A5FA",                // Status Info
};

// Border radius (from DESIGN-ADMIN.md Components section)
// Buttons: Rounded md (10px)
// Cards/Containers: Rounded lg (16px)
// Inputs: Radius: md (10px)
// Small elements: radius xs (6px)
const RADIUS = {
  xs: "0.375rem",   // 6px
  sm: "0.625rem",   // 10px (inputs)
  md: "0.625rem",   // 10px (buttons)
  lg: "1rem",       // 16px (cards)
  xl: "1.25rem",    // 20px (modals)
  circle: "99px",   // For perfect circles
};

// ─── Color dot preview ────────────────────────────────────────────────────

const COLOR_DOTS: Record<string, string> = {
  blue:   COLORS.info,
  green:  COLORS.success,
  yellow: COLORS.warning,
  red:    COLORS.error,
  purple: "#A78BFA",   // Not in DESIGN-ADMIN.md, keeping original
  pink:   "#F472B6",   // Not in DESIGN-ADMIN.md, keeping original
  indigo: "#818CF8",   // Not in DESIGN-ADMIN.md, keeping original
  orange: "#FB923C",   // Not in DESIGN-ADMIN.md, keeping original
};

const COLOR_OPTIONS = Object.keys(TAG_COLORS).map((color) => ({
  value: color,
  label: color.charAt(0).toUpperCase() + color.slice(1),
  icon: (
    <span
      style={{
        display: "inline-block",
        width: "0.5rem",
        height: "0.5rem",
        borderRadius: RADIUS.circle,
        background: COLOR_DOTS[color] ?? COLORS.silverMist,
        flexShrink: 0,
      }}
    />
  ),
}));

// ─── Shared input style (DESIGN-ADMIN.md — Inputs) ───────────────────────
const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  backgroundColor: COLORS.glassWhite,
  border: `1px solid ${COLORS.glassEdge}`,
  borderRadius: RADIUS.sm,
  color: COLORS.cloudWhite,
  padding: "0.625rem 0.875rem",
  outline: "none",
  fontFamily: "Inter, sans-serif",
  fontSize: "0.875rem",
  transition: "border-color 150ms",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TagManager({ tags, onRefresh }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: "", color: "blue", category: "general" });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const reducedMotion = useReducedMotion();

  function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── API calls ────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome da tag é obrigatório");
      return;
    }
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success("Tag criada com sucesso");
      resetForm();
      onRefresh();
    } catch {
      toast.error("Erro ao criar tag");
    }
  };

  const handleUpdate = async () => {
    if (!editingTag || !formData.name.trim()) return;
    try {
      const res = await fetch(`/api/admin/tags/${editingTag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      toast.success("Tag atualizada");
      resetForm();
      onRefresh();
    } catch {
      toast.error("Erro ao atualizar tag");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
      toast.success("Tag removida");
      onRefresh();
    } catch {
      toast.error("Erro ao remover tag");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color, category: tag.category });
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingTag(null);
    setFormData({ name: "", color: "blue", category: "general" });
  };

  const getButtonStyle = () => {
    if (!isAdding) {
      // Primary button (Nova Tag)
      const base = {
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.5rem 0.875rem",
        borderRadius: RADIUS.md,
        background: COLORS.goldPrestige,
        color: "#0A0A0A",
        border: "none",
        boxShadow: "0 2px 12px rgba(212,175,55,0.35)",
        fontSize: "0.8125rem",
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        cursor: "pointer",
        transition: "all 150ms"
      };
      if (isButtonHovered) {
        return {
          ...base,
          filter: "brightness(1.1)",
          boxShadow: "0 4px 20px rgba(212,175,55,0.45)"
        };
      }
      return base;
    } else {
      // Secondary button (Cancelar)
      const base = {
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.5rem 0.875rem",
        borderRadius: RADIUS.md,
        background: COLORS.glassWhite,
        border: `1px solid ${COLORS.glassEdge}`,
        color: COLORS.silverMist,
        boxShadow: "none",
        fontSize: "0.8125rem",
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
        cursor: "pointer",
        transition: "all 150ms"
      };
      if (isButtonHovered) {
        return {
          ...base,
          background: "rgba(255,255,255,0.10)",
          color: COLORS.cloudWhite
        };
      }
      return base;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "1rem" }}>

      {/* ── Form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{
              duration: reducedMotion ? 0.1 : 0.4,
              ...(reducedMotion ? {} : { ease: [0.16, 1, 0.3, 1] })
            }}
            style={{
              background: COLORS.glassWhite,
              border: `1px solid ${COLORS.glassEdge}`,
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              borderRadius: RADIUS.lg,
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Label do form */}
            <p style={{
              color: "#6B7280",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "Inter, sans-serif",
              marginBottom: "0.25rem",
            }}>
              {editingTag ? `Editando — ${editingTag.name}` : "Nova Tag"}
            </p>

            {/* Grid de campos */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
            }}>
              {/* Nome */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{
                  color: "#AEB7C1",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "Inter, sans-serif",
                }}>
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ex: Cliente VIP"
                  style={{
                    ...INPUT_STYLE,
                    ...(focusedField === "name" && {
                      borderColor: "rgba(255,255,255,0.25)",
                      boxShadow: "0 0 0 3px rgba(255,255,255,0.06)",
                    }),
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (editingTag ? handleUpdate() : handleCreate())}
                />
              </div>

              {/* Cor */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{
                  color: "#AEB7C1",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "Inter, sans-serif",
                }}>
                  Cor
                </label>
                <Select
                  label=""
                  value={formData.color}
                  onChange={(val) => setFormData({ ...formData, color: val })}
                  placeholder="Selecionar cor"
                  options={COLOR_OPTIONS}
                />
              </div>

              {/* Categoria */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{
                  color: "#AEB7C1",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontFamily: "Inter, sans-serif",
                }}>
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  onFocus={() => setFocusedField("category")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ex: vendas"
                  style={{
                    ...INPUT_STYLE,
                    ...(focusedField === "category" && {
                      borderColor: "rgba(255,255,255,0.25)",
                      boxShadow: "0 0 0 3px rgba(255,255,255,0.06)",
                    }),
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (editingTag ? handleUpdate() : handleCreate())}
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: RADIUS.md,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent",
                  color: "#6B7280",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={editingTag ? handleUpdate : handleCreate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.5rem 1.25rem",
                  borderRadius: RADIUS.md,
                  border: "none",
                  background: "#D4AF37",
                  color: "#0A0A0A",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(212,175,55,0.35)",
                  transition: "all 150ms",
                }}
              >
                <Check size={14} />
                {editingTag ? "Salvar alterações" : "Criar tag"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", marginTop: "0.5rem", marginBottom: "1rem" }}>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={getButtonStyle()}
          >
            <Plus size={16} />
            Nova Tag
          </button>
        )}
      </div>

      {/* ── Tags grid ── */}
      {tags.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(8rem, 1fr))",
          gap: "0.5rem",
        }}>
          {tags.map((tag, i) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.04 }}
              tabIndex={0}
              onMouseEnter={() => setActiveTagId(tag.id)}
              onMouseLeave={() => setActiveTagId(null)}
              onFocus={() => setActiveTagId(tag.id)}
              onBlur={() => setActiveTagId(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: RADIUS.xs,
                backgroundColor: hexToRgba(COLOR_DOTS[tag.color] ?? COLORS.silverMist, 0.15),
                border: `1px solid ${hexToRgba(COLOR_DOTS[tag.color] ?? COLORS.silverMist, 0.25)}`,
                color: COLOR_DOTS[tag.color] ?? COLORS.silverMist,
              }}
            >
              {/* Left: color dot */}
              <span
                style={{
                  width: "0.25rem",
                  height: "0.25rem",
                  borderRadius: "99px",
                  backgroundColor: COLOR_DOTS[tag.color] ?? COLORS.silverMist,
                  flexShrink: 0,
                }}
              />
              {/* Middle: tag name */}
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
              >
                {tag.name}
              </span>
              {/* Right: action buttons (edit/delete) */}
              {activeTagId === tag.id && (
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button
                    type="button"
                    onClick={() => startEdit(tag)}
                    title="Editar"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "1.5rem",
                      height: "1.5rem",
                      borderRadius: RADIUS.xs,
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.1)",
                      color: "#F7F7F5",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "0.75rem",
                    }}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tag.id)}
                    title="Remover"
                    disabled={deletingId === tag.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "1.5rem",
                      height: "1.5rem",
                      borderRadius: RADIUS.xs,
                      border: "1px solid rgba(248,113,113,0.3)",
                      background: "rgba(248,113,113,0.15)",
                      color: "#F87171",
                      cursor: deletingId === tag.id ? "not-allowed" : "pointer",
                      padding: 0,
                      fontSize: "0.75rem",
                    }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : !isAdding ? (
        /* ── Empty state ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 1rem",
            gap: "0.75rem",
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: "0.875rem",
          }}
        >
          <div style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "0.75rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <TagIcon size={16} style={{ color: "#6B7280" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#AEB7C1", fontSize: "0.875rem", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              Nenhuma tag criada
            </p>
            <p style={{ color: "#6B7280", fontSize: "0.75rem", fontFamily: "Inter, sans-serif", marginTop: "0.25rem" }}>
              Clique em "Nova Tag" para comenzar
            </p>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}