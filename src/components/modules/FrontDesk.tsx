// Front Desk Module
import { FrontDesk as FrontDeskContent } from '../frontdesk/FrontDesk';

interface FrontDeskProps {
  showFrontDeskSettings?: boolean;
  setShowFrontDeskSettings?: (show: boolean) => void;
}

export function FrontDesk({ showFrontDeskSettings, setShowFrontDeskSettings }: FrontDeskProps) {
  return <FrontDeskContent showFrontDeskSettings={showFrontDeskSettings} setShowFrontDeskSettings={setShowFrontDeskSettings} />;
}
