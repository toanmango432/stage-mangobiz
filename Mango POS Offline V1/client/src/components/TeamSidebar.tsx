import React from 'react';
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
                {member.status === 'busy' ? `Busy (${member.activeTickets} active ticket${member.activeTickets !== 1 ? 's' : ''})` : 'Ready'}
              </span>
            </div>
          </div>
        </div>)}
    </div>;
}
// ... rest of existing code ...