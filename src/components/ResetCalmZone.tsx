import { ResetAppProvider } from '@/reset-zone/contexts/AppContext';
import ResetHome from '@/reset-zone/pages/Home';

export default function ResetCalmZone() {
  return (
    <ResetAppProvider>
      <ResetHome />
    </ResetAppProvider>
  );
}
