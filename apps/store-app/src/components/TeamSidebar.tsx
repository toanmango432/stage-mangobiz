import { useTickets } from '../hooks/useTicketsCompat';

// ... existing code ...
export function TeamSidebar() {
  const {
    staff
  } = useTickets();
  // ... existing rendering code ...
  // Make sure to use the staff status from context
  return <div className="...">
      {staff.map(member => <div key={member.id} className="...">
          <div className="...">
            <div className={`... ${member.status === 'busy' ? 'bg-amber-500' : 'bg-green-500'}`}>
              {/* Status indicator */}
            </div>
            <div className="...">
              {member.name}
              <span className="...">
                {member.status === 'busy' ? `Busy (${member.activeTickets?.length || 0} active ticket${(member.activeTickets?.length || 0) !== 1 ? 's' : ''})` : 'Ready'}
              </span>
            </div>
          </div>
        </div>)}
    </div>;
}
// ... rest of existing code ...