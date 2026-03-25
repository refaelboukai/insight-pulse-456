import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffContacts, staffCategories } from '@/reset-zone/data/staff';
import { useApp } from '@/reset-zone/contexts/AppContext';
import { motion } from 'framer-motion';
import { Home, MessageCircle, Send } from 'lucide-react';

export default function ContactAdult() {
  const navigate = useNavigate();
  const { student, role, logActivity } = useApp();
  const [context, setContext] = useState('');
  const defaultMsg = 'היי, אני מרגיש שקשה לי עכשיו ואני צריך עזרה.';

  const handleContact = (contactName: string, whatsappUrl?: string) => {
    if (!whatsappUrl) return;
    const fullMsg = context.trim() ? `${defaultMsg}\n${context.trim()}` : defaultMsg;
    const url = `${whatsappUrl}?text=${encodeURIComponent(fullMsg)}`;
    if (role === 'student' && student) { logActivity({ studentId: student.id, studentName: student.name, selectedState: 'contact-adult', supportRequested: true, adultContactName: contactName, optionalContextText: context || undefined }); }
    window.open(url, '_blank');
  };

  return (
    <div className="reset-screen-container">
      <div className="text-center mb-6"><h2 className="text-xl font-bold text-foreground mb-2">פנייה למבוגר</h2><p className="text-base text-muted-foreground">אם קשה לך עכשיו, אתה לא צריך להתמודד לבד.<br />בחר איש צוות שתרצה לשלוח לו הודעת וואטסאפ.</p></div>
      <div className="reset-card p-4 mb-6"><label className="text-sm font-medium text-foreground mb-2 block">מה קורה?</label><textarea value={context} onChange={e => setContext(e.target.value)} placeholder="אפשר לכתוב כאן... (לא חובה)" className="w-full rounded-xl border border-input bg-background p-3 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></div>
      <div className="rounded-3xl p-6 bg-card border border-red-100" style={{ boxShadow: '0 4px 20px rgba(220, 38, 38, 0.06)' }}>
        <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2"><MessageCircle size={20} className="text-[#25D366]" />צוות וואטסאפ</h3>
        {staffCategories.map(cat => {
          const contacts = staffContacts.filter(c => c.category === cat);
          return (<div key={cat} className="mb-4"><h4 className="text-sm font-semibold mb-2 text-red-400">{cat}</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{contacts.map((c, i) => (<motion.button key={c.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} onClick={() => handleContact(c.name, c.whatsappUrl)} className="flex items-center justify-between rounded-2xl p-3 transition-colors bg-red-50/60 border border-red-100 hover:bg-red-50"><div className="flex items-center gap-2"><MessageCircle size={16} className="text-[#25D366]" /><span className="text-sm font-medium text-foreground">{c.name}</span><span className="text-xs text-muted-foreground">– {c.category}</span></div><Send size={14} className="text-[#25D366]" /></motion.button>))}</div></div>);
        })}
      </div>
      <div className="mt-8 flex justify-center"><button onClick={() => navigate('/reset')} className="reset-btn-secondary flex items-center gap-2"><Home size={16} /> חזרה למסך הראשי</button></div>
    </div>
  );
}
