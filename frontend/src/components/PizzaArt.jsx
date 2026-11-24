import { motion, AnimatePresence } from 'framer-motion';

// 24 evenly spread points inside the pizza (golden-angle spiral) so toppings never overlap or fall off
const SPOTS = Array.from({ length: 24 }, (_, n) => {
  const r = 26 + 76 * Math.sqrt(n / 24);
  const a = n * 2.399963;
  return [150 + r * Math.cos(a), 150 + r * Math.sin(a)];
});
const pop = { transformBox: 'fill-box', transformOrigin: 'center' };

// Live SVG pizza: base → sauce → cheese → toppings. Each layer animates in when chosen.
export default function PizzaArt({ base, sauce, cheese, veggies = [], size = 320, spin = false, animate = true }) {
  const crust = base?.color || '#ecd3a4';
  const n = veggies.length;
  const per = n <= 4 ? 4 : n <= 6 ? 3 : 2; // fewer veggies → more pieces each, so the pizza always looks full
  const tops = [];
  for (let j = 0; j < per; j++) veggies.forEach((v, i) => { const idx = j * n + i; if (idx < SPOTS.length) tops.push({ v, spot: SPOTS[idx], id: `${v._id}-${j}`, order: idx }); });
  const t = animate ? { type: 'spring', stiffness: 220, damping: 16 } : { duration: 0 };

  return (
    <motion.svg viewBox="0 0 300 300" width={size} height={size} style={{ maxWidth: '100%', height: 'auto', filter: 'drop-shadow(0 14px 18px rgba(120,60,10,.25))' }}
      animate={spin ? { rotate: 360 } : {}} transition={spin ? { repeat: Infinity, duration: 40, ease: 'linear' } : {}}>
      <circle cx="150" cy="150" r="144" fill={crust} />
      <circle cx="150" cy="150" r="144" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="3" />
      <circle cx="150" cy="150" r="132" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeDasharray="4 8" />
      <AnimatePresence>
        {sauce && <motion.circle key={'s' + sauce._id} cx="150" cy="150" r="124" fill={sauce.color} style={pop}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={t} />}
      </AnimatePresence>
      <AnimatePresence>
        {cheese && <motion.circle key={'c' + cheese._id} cx="150" cy="150" r="118" fill={cheese.color} fillOpacity=".95" style={pop}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={t} />}
      </AnimatePresence>
      {cheese && [[120, 110, 14], [182, 140, 11], [140, 200, 13], [96, 176, 9], [196, 86, 9]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff" fillOpacity=".2" />
      ))}
      <AnimatePresence>
        {tops.map(({ v, spot, id, order }) => (
          // The outer <g> positions the topping; the inner motion.text only animates scale/drop-in relative to it
          <g key={id} transform={`translate(${spot[0].toFixed(1)} ${spot[1].toFixed(1)})`}>
            <motion.text x="0" y="0" fontSize="26" textAnchor="middle" dominantBaseline="central" style={pop}
              initial={{ scale: 0, y: -30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              transition={animate ? { ...t, delay: order * 0.02 } : { duration: 0 }}>
              {v.emoji}
            </motion.text>
          </g>
        ))}
      </AnimatePresence>
    </motion.svg>
  );
}