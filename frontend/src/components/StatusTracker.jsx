import { motion } from 'framer-motion';

export const STEPS = [
  { key: 'Order Received', icon: '📥', label: 'Order received' },
  { key: 'In Kitchen', icon: '👨‍🍳', label: 'In kitchen' },
  { key: 'Sent to Delivery', icon: '🛵', label: 'Sent to delivery' },
];

export default function StatusTracker({ status }) {
  const idx = Math.max(0, STEPS.findIndex((s) => s.key === status));
  const pct = (idx / (STEPS.length - 1)) * 86; // fills the line between first and last dot
  return (
    <div className="tracker" role="status" aria-label={`Order status: ${status}`}>
      <motion.div className="tracker-fill" initial={false} animate={{ width: pct + '%' }} transition={{ duration: 0.8, ease: 'easeInOut' }} />
      {STEPS.map((s, i) => (
        <div key={s.key} className={`t-step ${i < idx ? 'done' : ''} ${i === idx ? (idx === STEPS.length - 1 ? 'done' : 'now') : ''}`}>
          <motion.div className="t-dot" key={status + i} initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
            {i < idx || (i === idx && idx === STEPS.length - 1) ? '✓' : s.icon}
          </motion.div>
          {s.label}
        </div>
      ))}
    </div>
  );
}
