/**
 * SegmentPreview - Phase 3 Client Segment Preview
 * Displays clients matching a segment with pagination and actions.
 *
 * Features:
 * - Display list of matching clients (name, phone, last visit)
 * - Show total count
 * - Pagination for large segments
 * - 'Export Segment' button
 * - 'Send Message' button (opens bulk message modal)
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Users,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react';
import { generateSegmentExportCsv } from '@/constants/segmentationConfig';
import type { Client, CustomSegment } from '@/types/client';

// ==================== CONSTANTS ====================

const PAGE_SIZE = 10;

// ==================== TYPES ====================

interface SegmentPreviewProps {
  /** The segment being previewed */
  segment: CustomSegment;
  /** List of clients matching the segment */
  clients: Client[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback when 'Send Message' is clicked */
  onSendMessage?: (clients: Client[]) => void;
  /** Optional: Callback when a client is clicked */
  onClientClick?: (client: Client) => void;
}

// ==================== HELPERS ====================

function formatDate(dateString?: string): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPhone(phone?: string): string {
  if (!phone) return '-';
  // Basic formatting for US numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() || '';
  const l = lastName?.charAt(0)?.toUpperCase() || '';
  return f + l || '?';
}

// ==================== COMPONENT ====================

export function SegmentPreview({
  segment,
  clients,
  isLoading = false,
  onSendMessage,
  onClientClick,
}: SegmentPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination
  const totalPages = Math.ceil(clients.length / PAGE_SIZE);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return clients.slice(start, start + PAGE_SIZE);
  }, [clients, currentPage]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = generateSegmentExportCsv(clients);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `segment-${segment.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[SegmentPreview] Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendMessage = () => {
    onSendMessage?.(clients);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Count clients with valid contact info
  const emailCount = clients.filter((c) => c.email).length;
  const phoneCount = clients.filter((c) => c.phone).length;

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: segment.color }}
          />
          <h3 className="font-semibold text-gray-900">{segment.name}</h3>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || clients.length === 0}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export
          </Button>
          {onSendMessage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSendMessage}
              disabled={clients.length === 0}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          )}
        </div>
      </div>

      {/* Contact Info Summary */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{emailCount} with email</span>
        <span>{phoneCount} with phone</span>
      </div>

      {/* Client List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading clients...</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No clients match this segment.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Client</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow
                  key={client.id}
                  className={onClientClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onClick={() => onClientClick?.(client)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 bg-gray-200 text-gray-600 text-xs font-medium">
                        <span>{getInitials(client.firstName, client.lastName)}</span>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </p>
                        {client.email && (
                          <p className="text-xs text-gray-500 truncate max-w-[180px]">
                            {client.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Phone className="w-3.5 h-3.5" />
                      {formatPhone(client.phone)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(client.visitSummary?.lastVisitDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {client.visitSummary?.totalVisits || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(client.visitSummary?.totalSpent || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(currentPage * PAGE_SIZE, clients.length)} of {clients.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SegmentPreview;
