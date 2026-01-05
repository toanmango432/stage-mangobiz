import { MobileTeamSection } from '../frontdesk/MobileTeamSection';

export function Team() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Full-screen team view for mobile */}
      <MobileTeamSection className="flex-1 min-h-0" />
    </div>
  );
}
