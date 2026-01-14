/**
 * StaffTooltip Component
 *
 * Displays detailed staff information in a tooltip on hover.
 */

interface StaffTooltipProps {
  staff: {
    name: string;
    status: string;
    turnCount?: number;
    clockInTime?: string | number;
    currentTicketInfo?: {
      serviceName?: string;
      clientName?: string;
      startTime: string;
      progress?: number;
    };
    nextAppointmentTime?: string;
    lastServiceTime?: string;
  };
}

export function StaffTooltip({ staff }: StaffTooltipProps) {
  return (
    <div className="p-2 max-w-xs">
      <p className="font-bold text-sm mb-1">{staff.name}</p>
      <div className="text-xs space-y-1">
        <p>
          <span className="font-medium">Status:</span> {staff.status}
        </p>
        {staff.turnCount !== undefined && (
          <p>
            <span className="font-medium">Turns:</span> {staff.turnCount}
          </p>
        )}
        {staff.clockInTime && (
          <p>
            <span className="font-medium">Clocked in:</span>{' '}
            {typeof staff.clockInTime === 'string'
              ? new Date(staff.clockInTime).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : String(staff.clockInTime)}
          </p>
        )}
        {staff.currentTicketInfo && (
          <>
            <p>
              <span className="font-medium">Current service:</span>{' '}
              {staff.currentTicketInfo.serviceName}
            </p>
            <p>
              <span className="font-medium">Client:</span> {staff.currentTicketInfo.clientName}
            </p>
            <p>
              <span className="font-medium">Started:</span> {staff.currentTicketInfo.startTime}
            </p>
            <p>
              <span className="font-medium">Progress:</span>{' '}
              {Math.round((staff.currentTicketInfo.progress ?? 0) * 100)}%
            </p>
          </>
        )}
        {staff.nextAppointmentTime && (
          <p>
            <span className="font-medium">Next Appt:</span> {staff.nextAppointmentTime}
          </p>
        )}
        {staff.lastServiceTime && (
          <p>
            <span className="font-medium">Last Done:</span> {staff.lastServiceTime}
          </p>
        )}
      </div>
    </div>
  );
}
