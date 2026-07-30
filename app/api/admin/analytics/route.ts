import { NextResponse } from 'next/server';
import { gte, lt, and, sql as sqlOp, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { contactInquiries, newsletterSubscriptions, workshopBookings } from '@/lib/db/schema';
import { requireAdmin, unauthorizedResponse } from '@/lib/session';

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [contacts, newsletters, bookings] = await Promise.all([
      db.select().from(contactInquiries),
      db.select().from(newsletterSubscriptions),
      db.select().from(workshopBookings),
    ]);

    const countInRange = (items: any[], start: Date, end?: Date) =>
      items.filter((i) => {
        const d = new Date(i.createdAt);
        return d >= start && (!end || d < end);
      }).length;

    // 30-day timeseries
    const days: Record<
      string,
      { date: string; contacts: number; newsletters: number; bookings: number }
    > = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      days[key] = { date: key, contacts: 0, newsletters: 0, bookings: 0 };
    }
    const fill = (items: any[], key: 'contacts' | 'newsletters' | 'bookings') => {
      items.forEach((item) => {
        const d = new Date(item.createdAt);
        if (d >= monthAgo) {
          const dayKey = d.toISOString().split('T')[0];
          if (days[dayKey]) days[dayKey][key]++;
        }
      });
    };
    fill(contacts, 'contacts');
    fill(newsletters, 'newsletters');
    fill(bookings, 'bookings');

    // Workshop popularity
    const workshopCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      workshopCounts[b.workshopType] = (workshopCounts[b.workshopType] || 0) + 1;
    });

    // Status breakdowns
    const contactStatus: Record<string, number> = {};
    contacts.forEach((c) => {
      contactStatus[c.status] = (contactStatus[c.status] || 0) + 1;
    });
    const bookingStatus: Record<string, number> = {};
    bookings.forEach((b) => {
      bookingStatus[b.status] = (bookingStatus[b.status] || 0) + 1;
    });

    // Priority distribution
    const contactPriority: Record<string, number> = {};
    contacts.forEach((c) => {
      const priority = c.priority || 'normal';
      contactPriority[priority] = (contactPriority[priority] || 0) + 1;
    });

    // Read/Unread stats
    const contactsUnread = contacts.filter((c) => !c.isRead).length;
    const bookingsUnread = bookings.filter((b) => !b.isRead).length;

    // Conversion rates
    const contactsConverted = contacts.filter((c) => c.status === 'converted').length;
    const bookingsConverted = bookings.filter((b) => b.status === 'converted').length;
    const contactConversionRate =
      contacts.length > 0 ? ((contactsConverted / contacts.length) * 100).toFixed(1) : '0';
    const bookingConversionRate =
      bookings.length > 0 ? ((bookingsConverted / bookings.length) * 100).toFixed(1) : '0';

    // Average response time (simulated - difference between created and when status changed)
    const contactsContacted = contacts.filter((c) => c.status !== 'new');
    const avgResponseTime =
      contactsContacted.length > 0
        ? Math.round(
            contactsContacted.reduce((sum, c) => {
              const created = new Date(c.createdAt).getTime();
              const updated = new Date(c.updatedAt).getTime();
              return sum + (updated - created) / (1000 * 60 * 60); // hours
            }, 0) / contactsContacted.length,
          )
        : 0;

    // Tag usage
    const tagUsage: Record<string, number> = {};
    [...contacts, ...bookings].forEach((item: any) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => {
          tagUsage[tag] = (tagUsage[tag] || 0) + 1;
        });
      }
    });

    // Monthly comparison
    const monthlyComparison = {
      contacts: {
        thisMonth: countInRange(contacts, monthAgo),
        lastMonth: countInRange(
          contacts,
          new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          monthAgo,
        ),
      },
      bookings: {
        thisMonth: countInRange(bookings, monthAgo),
        lastMonth: countInRange(
          bookings,
          new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          monthAgo,
        ),
      },
    };

    // Quarterly trend
    const quarterlyTrend: Record<string, any>[] = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      quarterlyTrend.unshift({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        contacts: countInRange(contacts, monthStart, monthEnd),
        bookings: countInRange(bookings, monthStart, monthEnd),
      });
    }

    return NextResponse.json({
      totals: {
        contacts: contacts.length,
        newsletters: newsletters.length,
        bookings: bookings.length,
      },
      today: {
        contacts: countInRange(contacts, today),
        newsletters: countInRange(newsletters, today),
        bookings: countInRange(bookings, today),
      },
      thisWeek: {
        contacts: countInRange(contacts, weekAgo),
        newsletters: countInRange(newsletters, weekAgo),
        bookings: countInRange(bookings, weekAgo),
      },
      lastWeek: {
        contacts: countInRange(contacts, lastWeekStart, weekAgo),
        newsletters: countInRange(newsletters, lastWeekStart, weekAgo),
        bookings: countInRange(bookings, lastWeekStart, weekAgo),
      },
      unread: {
        contacts: contactsUnread,
        bookings: bookingsUnread,
        total: contactsUnread + bookingsUnread,
      },
      conversion: {
        contacts: {
          converted: contactsConverted,
          total: contacts.length,
          rate: contactConversionRate,
        },
        bookings: {
          converted: bookingsConverted,
          total: bookings.length,
          rate: bookingConversionRate,
        },
      },
      responseMetrics: {
        avgResponseTimeHours: avgResponseTime,
        contactedCount: contactsContacted.length,
        pendingCount: contacts.filter((c) => c.status === 'new').length,
      },
      timeseries: Object.values(days).sort((a, b) => a.date.localeCompare(b.date)),
      workshopPopularity: Object.entries(workshopCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      contactStatus: Object.entries(contactStatus).map(([status, count]) => ({ status, count })),
      bookingStatus: Object.entries(bookingStatus).map(([status, count]) => ({ status, count })),
      contactPriority: Object.entries(contactPriority).map(([priority, count]) => ({
        priority,
        count,
      })),
      tagUsage: Object.entries(tagUsage)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10), // Top 10 tags
      monthlyComparison,
      quarterlyTrend,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
