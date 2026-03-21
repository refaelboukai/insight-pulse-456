import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffContacts, staffCategories } from '@/data/staff';
import { motion } from 'framer-motion';
import { Home, MessageCircle, Send } from 'lucide-react';
import PageTransition from '@/components/reset/PageTransition';

export default function ContactAdult() {
  const navigate = useNavigate();
  const [context, setContext] = useState('');
  const defaultMsg = 'היי, אני מרגיש שקשה לי עכשיו ואני צריך עזרה.';

  const handleContact = (contactName: string, whatsappUrl?: string) => {
    if (!whatsappUrl) return;
    const fullMsg = context.trim() ? `${defaultMsg}\n${context.trim()}` : defaultMsg;
    window.open(`${whatsappUrl}?text=${encodeURIComponent(fullMsg)}`, '_blank');
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-4" style={{ background: 'var(--gradient-warm)' }}>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">פנייה למבוגר</h2>
          <p className="text-sm text-muted-foreground">אם קשה לך עכשיו, אתה לא צריך להתמודד לבד.</p>
        </div>

        <div className="rounded-2xl border bg-card p-4 mb-6 shadow-sm max-w-md mx-auto">
          <label className="text-sm font-medium text-foreground mb-2 block">מה קורה?</label>
          <textarea value={context} onChange={e => setContext(e.target.value)}
            placeholder="אפשר לכתוב כאן... (לא חובה)"
            className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>

        <div className="rounded-2xl p-5 bg-card border shadow-sm max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
            <MessageCircle size={20} className="text-emerald-500" /> צוות וואטסאפ
          </h3>
          {staffCategories.map(cat => {
            const contacts = staffContacts.filter(c => c.category === cat);
            return (
              <div key={cat} className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-primary">{cat}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {contacts.map((c, i) => (
                    <motion.button key={c.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => handleContact(c.name, c.whatsappUrl)}
                      className="flex items-center justify-between rounded-xl p-3 border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-emerald-500" />
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground">– {c.category}</span>
                      </div>
                      <Send size={14} className="text-emerald-500" />
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button onClick={() => navigate('/student')} className="text-sm text-muted-foreground flex items-center gap-2">
            <Home size={16} /> חזרה למסך הראשי
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
