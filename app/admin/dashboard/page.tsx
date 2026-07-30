'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LogOut,
  Mail,
  Calendar,
  MessageSquare,
  Eye,
  Trash2,
  Save,
  BarChart3,
  Settings,
  ExternalLink,
  AlertCircle,
  Phone,
  EyeOff,
  Tag as TagIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession, signOut } from '@/lib/auth-client';
import EnhancedStatCard from '@/components/admin/EnhancedStatCard';
import FilterBar from '@/components/admin/FilterBar';
import StatusBadge from '@/components/admin/StatusBadge';
import DetailModal from '@/components/admin/DetailModal';
import EnhancedAnalyticsCharts from '@/components/admin/AnalyticsCharts';
import WorkshopManager from '@/components/admin/WorkshopManager';
import TestimonialManager from '@/components/admin/TestimonialManager';
import TagManager from '@/components/admin/TagManager';
import GalleryManager from '@/components/admin/GalleryManager';
import AdvancedFilters from '@/components/admin/AdvancedFilters';
import TagSelector from '@/components/admin/TagSelector';
import {
  exportToCSV,
  exportToExcel,
  filterByDateRange,
  searchFilter,
  formatDate,
  filterByTags,
  filterByPriority,
  filterByReadStatus,
  PRIORITY_CONFIG,
  TAG_COLORS,
} from '@/lib/admin-utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // ── authChecked: portão que impede o dashboard de renderizar antes da
  // sessão ser verificada. Elimina o "flash" onde o conteúdo admin aparece
  // brevemente para usuários não autenticados. ──────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'contacts' | 'newsletters' | 'bookings' | 'manage'
  >('overview');
  const [contacts, setContacts] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workshopFilter, setWorkshopFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readStatusFilter, setReadStatusFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'contact' | 'booking' | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  // ── Verificação de sessão ─────────────────────────────────────────────────
  // isPending: better-auth ainda está resolvendo a sessão → aguarda sem agir.
  // !session || role !== 'admin': redireciona para login.
  // Apenas após confirmar role admin é que setAuthChecked(true) é chamado,
  // liberando a renderização do dashboard.
  useEffect(() => {
    if (isPending) return;
    if (!session || (session.user as any).role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    setAuthChecked(true);
    fetchAll();
  }, [session, isPending, router]);

  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setWorkshopFilter('all');
    setPriorityFilter('all');
    setReadStatusFilter('all');
    setSelectedTags([]);
    setSelectedIds([]);
  }, [activeTab]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, n, b, a, t] = await Promise.all([
        fetch('/api/admin/contacts').then((r) => r.json()),
        fetch('/api/admin/newsletters').then((r) => r.json()),
        fetch('/api/admin/bookings').then((r) => r.json()),
        fetch('/api/admin/analytics').then((r) => r.json()),
        fetch('/api/admin/tags').then((r) => r.json()),
      ]);
      setContacts(Array.isArray(c) ? c : []);
      setNewsletters(Array.isArray(n) ? n : []);
      setBookings(Array.isArray(b) ? b : []);
      setAnalytics(a);
      setTags(Array.isArray(t) ? t : []);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
    toast.success('Logout realizado');
  };

  const updateStatus = async (
    type: 'contact' | 'booking',
    id: string,
    newStatus: string,
    notes?: string | null,
  ) => {
    try {
      const endpoint = type === 'contact' ? 'contacts' : 'bookings';
      const res = await fetch(`/api/admin/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (!res.ok) throw new Error();
      toast.success('Status atualizado!');
      fetchAll();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const toggleReadStatus = async (
    type: 'contact' | 'booking',
    id: string,
    currentStatus: boolean,
  ) => {
    try {
      const endpoint = type === 'contact' ? 'contacts' : 'bookings';
      const res = await fetch(`/api/admin/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !currentStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(currentStatus ? 'Marcado como não lido' : 'Marcado como lido');
      fetchAll();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const updateTags = async (type: 'contact' | 'booking', id: string, newTags: string[]) => {
    try {
      const endpoint = type === 'contact' ? 'contacts' : 'bookings';
      const res = await fetch(`/api/admin/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) throw new Error();
      toast.success('Tags atualizadas!');
      fetchAll();
    } catch {
      toast.error('Erro ao atualizar tags');
    }
  };

  const updatePriority = async (type: 'contact' | 'booking', id: string, newPriority: string) => {
    try {
      const endpoint = type === 'contact' ? 'contacts' : 'bookings';
      const res = await fetch(`/api/admin/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!res.ok) throw new Error();
      toast.success('Prioridade atualizada!');
      fetchAll();
    } catch {
      toast.error('Erro ao atualizar prioridade');
    }
  };

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      const endpoint =
        type === 'contact' ? 'contacts' : type === 'newsletter' ? 'newsletters' : 'bookings';
      await fetch(`/api/admin/${endpoint}/${id}`, { method: 'DELETE' });
      toast.success('Deletado!');
      setSelectedItem(null);
      fetchAll();
    } catch {
      toast.error('Erro ao deletar');
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Deletar ${selectedIds.length} item(s)?`)) return;
    try {
      const endpoint =
        activeTab === 'contacts'
          ? 'contacts'
          : activeTab === 'newsletters'
            ? 'newsletters'
            : 'bookings';
      const res = await fetch(`/api/admin/${endpoint}/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      toast.success(`${data.deletedCount} item(s) deletado(s)!`);
      setSelectedIds([]);
      fetchAll();
    } catch {
      toast.error('Erro');
    }
  };

  const saveNotes = async () => {
    if (!selectedItem || !modalType) return;
    try {
      const endpoint = modalType === 'contact' ? 'contacts' : 'bookings';
      await fetch(`/api/admin/${endpoint}/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedItem.status, notes: editingNotes }),
      });
      toast.success('Notas salvas!');
      setSelectedItem({ ...selectedItem, notes: editingNotes });
      fetchAll();
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const openModal = (item: any, type: 'contact' | 'booking') => {
    setSelectedItem(item);
    setModalType(type);
    setEditingNotes(item.notes || '');
  };

  const filteredContacts = useMemo(() => {
    let r = filterByDateRange(contacts, dateRange);
    r = searchFilter(r, searchQuery, ['name', 'email', 'message']);
    if (statusFilter !== 'all') r = r.filter((c: any) => (c.status || 'new') === statusFilter);
    if (priorityFilter !== 'all') r = filterByPriority(r, priorityFilter);
    if (readStatusFilter !== 'all') r = filterByReadStatus(r, readStatusFilter);
    if (selectedTags.length > 0) r = filterByTags(r, selectedTags);
    return r;
  }, [
    contacts,
    dateRange,
    searchQuery,
    statusFilter,
    priorityFilter,
    readStatusFilter,
    selectedTags,
  ]);

  const filteredNewsletters = useMemo(() => {
    let r = filterByDateRange(newsletters, dateRange);
    return searchFilter(r, searchQuery, ['email']);
  }, [newsletters, dateRange, searchQuery]);

  const filteredBookings = useMemo(() => {
    let r = filterByDateRange(bookings, dateRange);
    r = searchFilter(r, searchQuery, ['name', 'email', 'phone', 'workshopType', 'message']);
    if (statusFilter !== 'all') r = r.filter((b: any) => (b.status || 'new') === statusFilter);
    if (workshopFilter !== 'all') r = r.filter((b: any) => b.workshopType === workshopFilter);
    if (priorityFilter !== 'all') r = filterByPriority(r, priorityFilter);
    if (readStatusFilter !== 'all') r = filterByReadStatus(r, readStatusFilter);
    if (selectedTags.length > 0) r = filterByTags(r, selectedTags);
    return r;
  }, [
    bookings,
    dateRange,
    searchQuery,
    statusFilter,
    workshopFilter,
    priorityFilter,
    readStatusFilter,
    selectedTags,
  ]);

  const toggleSelect = (id: string) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
  const toggleSelectAll = (items: any[]) =>
    setSelectedIds(selectedIds.length === items.length ? [] : items.map((i) => i.id));

  const workshopOptions = useMemo(() => {
    const types = Array.from(new Set(bookings.map((b: any) => b.workshopType)));
    return types.map((t) => ({ value: t, label: t }));
  }, [bookings]);

  const clearAdvancedFilters = () => {
    setPriorityFilter('all');
    setReadStatusFilter('all');
    setSelectedTags([]);
  };

  const exports = {
    contacts: () =>
      exportToCSV(filteredContacts, 'contatos', [
        { key: 'name', label: 'Nome' },
        { key: 'email', label: 'Email' },
        { key: 'message', label: 'Mensagem' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Prioridade' },
        { key: 'tags', label: 'Tags' },
        { key: 'isRead', label: 'Lido' },
        { key: 'notes', label: 'Notas' },
        { key: 'createdAt', label: 'Data' },
      ]),
    contactsExcel: () =>
      exportToExcel(filteredContacts, 'contatos', [
        { key: 'name', label: 'Nome' },
        { key: 'email', label: 'Email' },
        { key: 'message', label: 'Mensagem' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Prioridade' },
        { key: 'tags', label: 'Tags' },
        { key: 'isRead', label: 'Lido' },
        { key: 'notes', label: 'Notas' },
        { key: 'createdAt', label: 'Data' },
      ]),
    newsletters: () =>
      exportToCSV(filteredNewsletters, 'newsletter', [
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Data' },
      ]),
    newslettersExcel: () =>
      exportToExcel(filteredNewsletters, 'newsletter', [
        { key: 'email', label: 'Email' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Data' },
      ]),
    bookings: () =>
      exportToCSV(filteredBookings, 'workshops', [
        { key: 'name', label: 'Nome' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Telefone' },
        { key: 'workshopType', label: 'Workshop' },
        { key: 'preferredDate', label: 'Data Preferida' },
        { key: 'message', label: 'Mensagem' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Prioridade' },
        { key: 'tags', label: 'Tags' },
        { key: 'isRead', label: 'Lido' },
        { key: 'notes', label: 'Notas' },
        { key: 'createdAt', label: 'Data' },
      ]),
    bookingsExcel: () =>
      exportToExcel(filteredBookings, 'workshops', [
        { key: 'name', label: 'Nome' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Telefone' },
        { key: 'workshopType', label: 'Workshop' },
        { key: 'preferredDate', label: 'Data Preferida' },
        { key: 'message', label: 'Mensagem' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Prioridade' },
        { key: 'tags', label: 'Tags' },
        { key: 'isRead', label: 'Lido' },
        { key: 'notes', label: 'Notas' },
        { key: 'createdAt', label: 'Data' },
      ]),
  };

  const contactPriorityStats = useMemo(
    () => ({
      high: contacts.filter((c) => c.priority === 'high').length,
      urgent: contacts.filter((c) => c.priority === 'urgent').length,
    }),
    [contacts],
  );

  const bookingPriorityStats = useMemo(
    () => ({
      high: bookings.filter((b) => b.priority === 'high').length,
      urgent: bookings.filter((b) => b.priority === 'urgent').length,
    }),
    [bookings],
  );

  const contactsUnread = useMemo(() => contacts.filter((c) => !c.isRead).length, [contacts]);
  const bookingsUnread = useMemo(() => bookings.filter((b) => !b.isRead).length, [bookings]);

  // ── Guard 1: sessão ainda não verificada → tela preta, sem flash ──────────
  if (!authChecked) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0A0A0A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              border: '2px solid rgba(212,175,55,0.2)',
              borderTopColor: '#D4AF37',
              margin: '0 auto 1rem',
            }}
          />
          <p
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            FLY CREW
          </p>
        </div>
      </div>
    );
  }

  // ── Guard 2: sessão confirmada, dados ainda carregando ────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-executive-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-2 border-gold-prestige/20 border-t-gold-prestige rounded-full mx-auto"
          />
          <p className="text-sm uppercase tracking-[0.3em] text-gold-prestige font-semibold">
            FLY CREW
          </p>
          <p className="text-xs text-silver-mist">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'contacts', label: `Contatos (${contacts.length})`, icon: MessageSquare },
    { id: 'newsletters', label: `Newsletter (${newsletters.length})`, icon: Mail },
    { id: 'bookings', label: `Workshops (${bookings.length})`, icon: Calendar },
    { id: 'manage', label: 'Gerenciar', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-executive-black relative isolate">
      {/* Ambient glow layer — necessário para o backdrop-blur dos cards glass
          ter algo com variação de cor/luz para borrar. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-20 w-[700px] h-[700px] rounded-full opacity-[0.14] blur-[110px]"
          style={{ background: 'radial-gradient(circle, #D4AF37, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full opacity-[0.12] blur-[110px]"
          style={{ background: 'radial-gradient(circle, #4A90D9, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.10] blur-[110px]"
          style={{ background: 'radial-gradient(circle, #F7F7F5, transparent 70%)' }}
        />
      </div>

      {/* Header */}
      <div className="bg-midnight-premium/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-[#F7F7F5]">FLY CREW ADMIN</h1>
              <p className="text-xs text-silver-mist mt-0.5">{session?.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-sm text-silver-mist hover:text-gold-prestige transition-colors"
              >
                <ExternalLink size={14} /> Ver Site
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-transparent border border-gold-prestige text-gold-prestige hover:bg-gold-prestige hover:text-executive-black px-4 py-2 text-xs tracking-wider uppercase font-semibold transition-all rounded-lg"
                data-testid="logout-btn"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex gap-1 glass-scrollbar overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'text-gold-prestige border-gold-prestige'
                      : 'text-silver-mist border-transparent hover:text-white'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Overview */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EnhancedStatCard
                icon={MessageSquare}
                label="Contatos"
                value={analytics.totals.contacts}
                today={analytics.today.contacts}
                thisWeek={analytics.thisWeek.contacts}
                lastWeek={analytics.lastWeek.contacts}
                unreadCount={contactsUnread}
                highPriorityCount={contactPriorityStats.high}
                delay={0}
              />
              <EnhancedStatCard
                icon={Mail}
                label="Newsletter"
                value={analytics.totals.newsletters}
                today={analytics.today.newsletters}
                thisWeek={analytics.thisWeek.newsletters}
                lastWeek={analytics.lastWeek.newsletters}
                delay={0.1}
              />
              <EnhancedStatCard
                icon={Calendar}
                label="Workshops"
                value={analytics.totals.bookings}
                today={analytics.today.bookings}
                thisWeek={analytics.thisWeek.bookings}
                lastWeek={analytics.lastWeek.bookings}
                unreadCount={bookingsUnread}
                highPriorityCount={bookingPriorityStats.high}
                delay={0.2}
              />
            </div>
            <EnhancedAnalyticsCharts analytics={analytics} />
          </div>
        )}

        {/* Contacts */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              selectedCount={selectedIds.length}
              onExport={exports.contacts}
              onExportExcel={exports.contactsExcel}
              onBulkDelete={bulkDelete}
              searchPlaceholder="Buscar contatos..."
            />
            <AdvancedFilters
              tags={tags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              priority={priorityFilter}
              onPriorityChange={setPriorityFilter}
              readStatus={readStatusFilter}
              onReadStatusChange={setReadStatusFilter}
              onClearAll={clearAdvancedFilters}
            />
            <div className="bg-midnight-premium/30 border border-white/10 overflow-hidden rounded-lg">
              <div className="glass-scrollbar overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-midnight-premium/50 border-b border-white/10">
                    <tr>
                      <th className="text-left p-4 w-8">
                        <input
                          type="checkbox"
                          checked={
                            filteredContacts.length > 0 &&
                            selectedIds.length === filteredContacts.length
                          }
                          onChange={() => toggleSelectAll(filteredContacts)}
                          className="accent-gold-prestige"
                        />
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Nome
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Email
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Status
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Prioridade
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Tags
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Data
                      </th>
                      <th className="text-right p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-silver-mist">
                          Nenhum contato encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredContacts.map((c: any) => (
                        <tr
                          key={c.id}
                          className={`border-b border-white/5 hover:bg-white/[0.02] cursor-pointer ${!c.isRead ? 'bg-white/[0.04]' : ''}`}
                          onClick={() => openModal(c, 'contact')}
                        >
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(c.id)}
                              onChange={() => toggleSelect(c.id)}
                              className="accent-gold-prestige"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{c.name}</p>
                              {!c.isRead && <EyeOff className="w-3 h-3 text-[#AEB7C1]" />}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-silver-mist">{c.email}</td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <StatusBadge
                              status={c.status || 'new'}
                              editable
                              onChange={(s) => updateStatus('contact', c.id, s, c.notes)}
                            />
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-xs px-2 py-1 border rounded ${PRIORITY_CONFIG[c.priority || 'normal']?.color || PRIORITY_CONFIG.normal.color}`}
                            >
                              {PRIORITY_CONFIG[c.priority || 'normal']?.label || 'Normal'}
                            </span>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <TagSelector
                              selectedTags={c.tags || []}
                              availableTags={tags}
                              onChange={(newTags) => updateTags('contact', c.id, newTags)}
                              compact
                            />
                          </td>
                          <td className="p-4 text-xs text-silver-mist">
                            {formatDate(c.createdAt)}
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleReadStatus('contact', c.id, c.isRead)}
                                className="text-silver-mist hover:text-gold-prestige p-1"
                                title={c.isRead ? 'Marcar como não lido' : 'Marcar como lido'}
                              >
                                {c.isRead ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                              <button
                                onClick={() => openModal(c, 'contact')}
                                className="text-gold-prestige hover:text-white p-1"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter */}
        {activeTab === 'newsletters' && (
          <div>
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              showStatusFilter={false}
              selectedCount={selectedIds.length}
              onExport={exports.newsletters}
              onExportExcel={exports.newslettersExcel}
              onBulkDelete={bulkDelete}
              searchPlaceholder="Buscar por email..."
            />
            <div className="bg-midnight-premium/30 border border-white/10 overflow-hidden rounded-lg">
              <div className="glass-scrollbar overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-midnight-premium/50 border-b border-white/10">
                    <tr>
                      <th className="text-left p-4 w-8">
                        <input
                          type="checkbox"
                          checked={
                            filteredNewsletters.length > 0 &&
                            selectedIds.length === filteredNewsletters.length
                          }
                          onChange={() => toggleSelectAll(filteredNewsletters)}
                          className="accent-gold-prestige"
                        />
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Email
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Status
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Inscrito em
                      </th>
                      <th className="text-right p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNewsletters.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-silver-mist">
                          Nenhuma inscrição
                        </td>
                      </tr>
                    ) : (
                      filteredNewsletters.map((s: any) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(s.id)}
                              onChange={() => toggleSelect(s.id)}
                              className="accent-gold-prestige"
                            />
                          </td>
                          <td className="p-4 text-white font-medium">{s.email}</td>
                          <td className="p-4">
                            <span className="text-xs px-3 py-1 border bg-green-500/20 text-green-300 border-green-500/30 font-semibold uppercase tracking-wider rounded">
                              Ativo
                            </span>
                          </td>
                          <td className="p-4 text-xs text-silver-mist">
                            {formatDate(s.createdAt)}
                          </td>
                          <td className="p-4 text-right">
                            <a
                              href={`mailto:${s.email}`}
                              className="inline-block text-gold-prestige hover:text-white p-1 mr-2"
                            >
                              <Mail size={16} />
                            </a>
                            <button
                              onClick={() => deleteItem('newsletter', s.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              workshopFilter={workshopFilter}
              onWorkshopFilterChange={setWorkshopFilter}
              showWorkshopFilter
              workshopOptions={workshopOptions}
              selectedCount={selectedIds.length}
              onExport={exports.bookings}
              onExportExcel={exports.bookingsExcel}
              onBulkDelete={bulkDelete}
              searchPlaceholder="Buscar reservas..."
            />
            <AdvancedFilters
              tags={tags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              priority={priorityFilter}
              onPriorityChange={setPriorityFilter}
              readStatus={readStatusFilter}
              onReadStatusChange={setReadStatusFilter}
              onClearAll={clearAdvancedFilters}
            />
            <div className="bg-midnight-premium/30 border border-white/10 overflow-hidden rounded-lg">
              <div className="glass-scrollbar overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-midnight-premium/50 border-b border-white/10">
                    <tr>
                      <th className="text-left p-4 w-8">
                        <input
                          type="checkbox"
                          checked={
                            filteredBookings.length > 0 &&
                            selectedIds.length === filteredBookings.length
                          }
                          onChange={() => toggleSelectAll(filteredBookings)}
                          className="accent-gold-prestige"
                        />
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Nome
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Workshop
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Telefone
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Status
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Prioridade
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Tags
                      </th>
                      <th className="text-left p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Data
                      </th>
                      <th className="text-right p-4 text-xs uppercase tracking-wider text-silver-mist">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-silver-mist">
                          Nenhuma reserva
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b: any) => (
                        <tr
                          key={b.id}
                          className={`border-b border-white/5 hover:bg-white/[0.02] cursor-pointer ${!b.isRead ? 'bg-white/[0.04]' : ''}`}
                          onClick={() => openModal(b, 'booking')}
                        >
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(b.id)}
                              onChange={() => toggleSelect(b.id)}
                              className="accent-gold-prestige"
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-white font-medium">{b.name}</p>
                                <p className="text-xs text-silver-mist">{b.email}</p>
                              </div>
                              {!b.isRead && <EyeOff className="w-3 h-3 text-[#AEB7C1]" />}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-silver-mist">{b.workshopType}</td>
                          <td className="p-4 text-sm text-silver-mist">{b.phone}</td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <StatusBadge
                              status={b.status || 'new'}
                              editable
                              onChange={(s) => updateStatus('booking', b.id, s, b.notes)}
                            />
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-xs px-2 py-1 border rounded ${PRIORITY_CONFIG[b.priority || 'normal']?.color || PRIORITY_CONFIG.normal.color}`}
                            >
                              {PRIORITY_CONFIG[b.priority || 'normal']?.label || 'Normal'}
                            </span>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <TagSelector
                              selectedTags={b.tags || []}
                              availableTags={tags}
                              onChange={(newTags) => updateTags('booking', b.id, newTags)}
                              compact
                            />
                          </td>
                          <td className="p-4 text-xs text-silver-mist">
                            {formatDate(b.createdAt)}
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleReadStatus('booking', b.id, b.isRead)}
                                className="text-silver-mist hover:text-gold-prestige p-1"
                                title={b.isRead ? 'Marcar como não lido' : 'Marcar como lido'}
                              >
                                {b.isRead ? <Eye size={16} /> : <EyeOff size={16} />}
                              </button>
                              <button
                                onClick={() => openModal(b, 'booking')}
                                className="text-gold-prestige hover:text-white p-1"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Manage */}
        {activeTab === 'manage' && (
          <div className="space-y-8">
            <TagManager tags={tags} onRefresh={fetchAll} />
            <div className="border-t border-white/10 pt-8">
              <WorkshopManager />
            </div>
            <div className="border-t border-white/10 pt-8">
              <TestimonialManager />
            </div>
            <div className="border-t border-white/10 pt-8">
              <GalleryManager />
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={modalType === 'contact' ? 'Detalhes do Contato' : 'Detalhes da Reserva'}
      >
        {selectedItem && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 pb-5 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">Nome</p>
                <p className="text-white font-medium">{selectedItem.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">Status</p>
                <StatusBadge
                  status={selectedItem.status || 'new'}
                  editable
                  onChange={(s) => {
                    updateStatus(modalType!, selectedItem.id, s, editingNotes);
                    setSelectedItem({ ...selectedItem, status: s });
                  }}
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">
                  Prioridade
                </p>
                <select
                  value={selectedItem.priority || 'normal'}
                  onChange={(e) => {
                    updatePriority(modalType!, selectedItem.id, e.target.value);
                    setSelectedItem({ ...selectedItem, priority: e.target.value });
                  }}
                  className="w-full px-3 py-2 bg-executive-black/50 border border-white/10 rounded-lg text-white text-sm"
                >
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">
                  Status de Leitura
                </p>
                <button
                  onClick={() => {
                    toggleReadStatus(modalType!, selectedItem.id, selectedItem.isRead);
                    setSelectedItem({ ...selectedItem, isRead: !selectedItem.isRead });
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                    selectedItem.isRead
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {selectedItem.isRead ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  {selectedItem.isRead ? 'Lido' : 'Não Lido'}
                </button>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wider text-gold-prestige mb-2">Tags</p>
                <TagSelector
                  selectedTags={selectedItem.tags || []}
                  availableTags={tags}
                  onChange={(newTags) => {
                    updateTags(modalType!, selectedItem.id, newTags);
                    setSelectedItem({ ...selectedItem, tags: newTags });
                  }}
                />
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">Email</p>
                <a
                  href={`mailto:${selectedItem.email}`}
                  className="text-white hover:text-gold-prestige break-all"
                >
                  {selectedItem.email}
                </a>
              </div>
              {selectedItem.phone && (
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">
                    Telefone
                  </p>
                  <a
                    href={`tel:${selectedItem.phone}`}
                    className="text-white hover:text-gold-prestige"
                  >
                    {selectedItem.phone}
                  </a>
                </div>
              )}
              {selectedItem.workshopType && (
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">
                    Workshop
                  </p>
                  <p className="text-white">{selectedItem.workshopType}</p>
                </div>
              )}
              {selectedItem.preferredDate && (
                <div className="col-span-2">
                  <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">
                    Data Preferida
                  </p>
                  <p className="text-white">{selectedItem.preferredDate}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wider text-gold-prestige mb-1">
                  Submetido em
                </p>
                <p className="text-white">{formatDate(selectedItem.createdAt)}</p>
              </div>
            </div>
            {selectedItem.message && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gold-prestige mb-2">Mensagem</p>
                <p className="text-silver-mist text-sm leading-relaxed bg-executive-black/30 p-4 border border-white/5 rounded-lg">
                  {selectedItem.message}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wider text-gold-prestige mb-2">
                Notas Internas
              </p>
              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                rows={3}
                placeholder="Adicione notas internas..."
                className="w-full bg-executive-black/50 border border-white/10 focus:border-gold-prestige text-white p-3 text-sm outline-none resize-none rounded-lg"
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
              <a
                href={`mailto:${selectedItem.email}`}
                className="flex items-center gap-2 bg-gold-prestige/20 border border-gold-prestige/30 text-gold-prestige hover:bg-gold-prestige hover:text-executive-black px-4 py-2 text-xs tracking-wider uppercase font-semibold rounded-lg transition-all"
              >
                <Mail size={14} /> Enviar Email
              </a>
              {selectedItem.phone && (
                <a
                  href={`tel:${selectedItem.phone}`}
                  className="flex items-center gap-2 bg-gold-prestige/20 border border-gold-prestige/30 text-gold-prestige hover:bg-gold-prestige hover:text-executive-black px-4 py-2 text-xs tracking-wider uppercase font-semibold rounded-lg transition-all"
                >
                  <Phone size={14} /> Ligar
                </a>
              )}
              <button
                onClick={saveNotes}
                className="flex items-center gap-2 bg-gold-prestige text-executive-black hover:bg-gold-prestige/90 px-4 py-2 text-xs tracking-wider uppercase font-semibold rounded-lg transition-all"
              >
                <Save size={14} /> Salvar Notas
              </button>
              <button
                onClick={() => deleteItem(modalType!, selectedItem.id)}
                className="flex items-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 px-4 py-2 text-xs tracking-wider uppercase font-semibold ml-auto rounded-lg transition-all"
              >
                <Trash2 size={14} /> Deletar
              </button>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
