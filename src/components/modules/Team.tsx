import { MobileTeamSection } from '../frontdesk/MobileTeamSection';

export function Team() {
  return (
    <div className="h-full bg-gray-50">
      {/* Full-screen team view for mobile */}
      <MobileTeamSection className="h-full" />
    </div>
  );
}
