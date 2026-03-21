import { motion } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

interface Props { children: ReactNode; className?: string; }

const PageTransition = forwardRef<HTMLDivElement, Props>(({ children, className }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    className={className}
  >
    {children}
  </motion.div>
));

PageTransition.displayName = 'PageTransition';
export default PageTransition;
