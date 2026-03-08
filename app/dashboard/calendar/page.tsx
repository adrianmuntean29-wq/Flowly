'use client';

import { useEffect, useState } from 'react';
import { usePosts } from '@/lib/hooks/useApi';
import { useRouter } from 'next/navigation';

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

const TYPE_COLORS: Record<string, string> = {
  POST:     '#667eea',
  CAROUSEL: '#f093fb',
  REEL:     '#4facfe',
  VIDEO:    '#43e97b',
  AD:       '#fa709a',
};

const STATUS_DOT: Record<string, string> = {
  DRAFT:     '#9ca3af',
  SCHEDULED: '#f59e0b',
  PUBLISHED: '#10b981',
};

export default function CalendarPage() {
  const { list } = usePosts();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        // Load all posts (drafts + scheduled + published) for calendar
        const [scheduled, drafts, published] = await Promise.all([
          list('SCHEDULED'),
          list('DRAFT'),
          list('PUBLISHED'),
        ]);
        const all = [
          ...(scheduled.posts || []),
          ...(drafts.posts || []),
          ...(published.posts || []),
        ];
        setPosts(all);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  // Monday-based: getDay() returns 0=Sun → shift to Mon=0
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const cells: { day: number; curMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startDow) {
      cells.push({ day: daysInPrev - startDow + 1 + i, curMonth: false });
    } else if (i < startDow + daysInMonth) {
      cells.push({ day: i - startDow + 1, curMonth: true });
    } else {
      cells.push({ day: i - startDow - daysInMonth + 1, curMonth: false });
    }
  }

  // Group posts by date string
  const postsByDate: Record<string, any[]> = {};
  posts.forEach((post) => {
    const date = post.scheduledFor || post.createdAt;
    if (!date) return;
    const d = new Date(date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate().toString();
      if (!postsByDate[key]) postsByDate[key] = [];
      postsByDate[key].push(post);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const selectedPosts = selectedDay ? (postsByDate[selectedDay.toString()] || []) : [];
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Count posts this month
  const monthCount = Object.values(postsByDate).flat().length;
  const scheduledCount = Object.values(postsByDate).flat().filter(p => p.status === 'SCHEDULED').length;

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
            Calendar
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            {monthCount} posturi în {MONTHS[month]} · {scheduledCount} programate
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/generate')}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white', border: 'none', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', fontWeight: '700',
          }}
        >
          ✨ Post nou
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Calendar */}
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {/* Month navigation */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <button onClick={prevMonth} style={navBtn}>‹</button>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {MONTHS[month]} {year}
            </h3>
            <button onClick={nextMonth} style={navBtn}>›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f3f4f6' }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{
                padding: '10px 0', textAlign: 'center',
                fontSize: '11px', fontWeight: '700', color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
              Se încarcă...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {cells.map((cell, idx) => {
                const dayPosts = cell.curMonth ? (postsByDate[cell.day.toString()] || []) : [];
                const isSelected = selectedDay === cell.day && cell.curMonth;
                const isTodayCell = cell.curMonth && isToday(cell.day);

                return (
                  <div
                    key={idx}
                    onClick={() => cell.curMonth && setSelectedDay(isSelected ? null : cell.day)}
                    style={{
                      minHeight: '80px',
                      padding: '8px',
                      borderRight: '1px solid #f3f4f6',
                      borderBottom: '1px solid #f3f4f6',
                      background: isSelected ? '#eef2ff' : 'white',
                      cursor: cell.curMonth ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (cell.curMonth && !isSelected) (e.currentTarget as HTMLElement).style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'white';
                    }}
                  >
                    {/* Day number */}
                    <div style={{
                      fontSize: '13px',
                      fontWeight: isTodayCell ? '800' : '500',
                      color: !cell.curMonth ? '#d1d5db' : isTodayCell ? 'white' : '#374151',
                      width: '26px', height: '26px',
                      borderRadius: '50%',
                      background: isTodayCell ? '#667eea' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '4px',
                    }}>
                      {cell.day}
                    </div>

                    {/* Post pills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayPosts.slice(0, 3).map((post, i) => (
                        <div key={i} style={{
                          fontSize: '10px', fontWeight: '600',
                          padding: '2px 5px', borderRadius: '3px',
                          background: `${TYPE_COLORS[post.type] || '#667eea'}22`,
                          color: TYPE_COLORS[post.type] || '#667eea',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          display: 'flex', alignItems: 'center', gap: '3px',
                        }}>
                          <span style={{
                            width: '5px', height: '5px', borderRadius: '50%',
                            background: STATUS_DOT[post.status] || '#9ca3af',
                            flexShrink: 0,
                          }} />
                          {post.type}
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600', paddingLeft: '4px' }}>
                          +{dayPosts.length - 3} mai mult
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'center' }}>Status:</span>
              {Object.entries(STATUS_DOT).map(([status, color]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                  {status === 'DRAFT' ? 'Draft' : status === 'SCHEDULED' ? 'Programat' : 'Publicat'}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', alignSelf: 'center' }}>Tip:</span>
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6b7280' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, display: 'inline-block' }} />
                  {type}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected day posts */}
          {selectedDay ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {selectedDay} {MONTHS[month]}
                </h4>
                <button
                  onClick={() => router.push(`/dashboard/generate`)}
                  style={{
                    padding: '5px 10px', fontSize: '11px', fontWeight: '600',
                    background: '#667eea', color: 'white', border: 'none',
                    borderRadius: '6px', cursor: 'pointer',
                  }}
                >
                  + Adaugă
                </button>
              </div>

              {selectedPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                  <p style={{ fontSize: '13px', margin: 0 }}>Niciun post în această zi</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedPosts.map((post) => (
                    <div key={post.id} style={{
                      padding: '12px', borderRadius: '10px',
                      border: `1.5px solid ${TYPE_COLORS[post.type] || '#667eea'}44`,
                      background: `${TYPE_COLORS[post.type] || '#667eea'}08`,
                    }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', padding: '2px 7px',
                          background: TYPE_COLORS[post.type] || '#667eea',
                          color: 'white', borderRadius: '4px',
                        }}>
                          {post.type}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: '600', color: STATUS_DOT[post.status] || '#9ca3af',
                        }}>
                          ● {post.status}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '12px', color: '#374151', margin: '0 0 8px 0',
                        lineHeight: '1.5',
                        display: '-webkit-box', WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      } as any}>
                        {post.caption}
                      </p>
                      {post.scheduledFor && (
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                          📅 {new Date(post.scheduledFor).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {post.images?.[0] && (
                        <img src={post.images[0]} alt="thumb"
                          style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginTop: '8px' }} />
                      )}
                      <button
                        onClick={() => router.push('/dashboard/posts')}
                        style={{
                          marginTop: '8px', width: '100%', padding: '6px',
                          background: '#f3f4f6', border: 'none', borderRadius: '6px',
                          fontSize: '12px', fontWeight: '600', color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Editează
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>👆</div>
              <p style={{ fontSize: '13px', margin: 0 }}>Selectează o zi pentru a vedea posturile</p>
            </div>
          )}

          {/* This month summary */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#111827', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sumar {MONTHS[month]}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Total posturi', value: monthCount, color: '#667eea' },
                { label: 'Programate', value: scheduledCount, color: '#f59e0b' },
                { label: 'Publicate', value: Object.values(postsByDate).flat().filter(p => p.status === 'PUBLISHED').length, color: '#10b981' },
                { label: 'Draft-uri', value: Object.values(postsByDate).flat().filter(p => p.status === 'DRAFT').length, color: '#9ca3af' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: '36px', height: '36px',
  background: '#f3f4f6', border: 'none',
  borderRadius: '8px', fontSize: '20px',
  cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  color: '#374151', fontWeight: '600',
};
