import { useRef, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { updateServiceStatusInSupabase } from '@/store/slices/ticketsSlice';
import type { ServiceStatus as TicketServiceStatus } from '@/types/common';
import type { TicketService, StaffMember } from '../ServiceList';
import type { Service } from '../ServiceGrid';

interface UseTicketServicesOptions {
  ticketId: string | null;
  services: TicketService[];
  staffMembers: StaffMember[];
  preSelectedStaff: { id: string; name: string } | null;
  activeStaffId: string | null;
  assignedStaffIds: string[];
  dispatch: (action: any) => void;
  ticketActions: any;
}

/**
 * Hook to handle service-related operations for the checkout panel.
 */
export function useTicketServices({
  ticketId,
  services,
  staffMembers,
  preSelectedStaff,
  activeStaffId,
  assignedStaffIds,
  dispatch,
  ticketActions,
}: UseTicketServicesOptions) {
  const reduxDispatch = useAppDispatch();
  const { toast } = useToast();
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add multiple services to ticket
  const handleAddServices = useCallback((
    selectedServices: Service[],
    staffId?: string,
    staffName?: string
  ) => {
    const targetStaffId = staffId || preSelectedStaff?.id || activeStaffId || undefined;
    const targetStaffName = staffName || preSelectedStaff?.name ||
      (targetStaffId && staffMembers.find(s => s.id === targetStaffId)?.name) || undefined;

    const newTicketServices: TicketService[] = selectedServices.map(service => ({
      id: Math.random().toString(),
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      price: service.price,
      duration: service.duration,
      status: 'not_started' as const,
      staffId: targetStaffId,
      staffName: targetStaffName,
    }));

    dispatch(ticketActions.addService(newTicketServices));

    toast({
      title: `${selectedServices.length} Service${selectedServices.length > 1 ? 's' : ''} Added`,
      description: targetStaffName ? `Assigned to ${targetStaffName}` : 'Service added to ticket',
    });
    console.log(`Added ${selectedServices.length} service(s)`, { staffId: targetStaffId, staffName: targetStaffName });
  }, [preSelectedStaff, activeStaffId, staffMembers, dispatch, ticketActions, toast]);

  // Update service
  const handleUpdateService = useCallback((serviceId: string, updates: Partial<TicketService>) => {
    // Update local state immediately for responsive UI
    dispatch(ticketActions.updateService(serviceId, updates));

    // Persist status changes to Supabase if we have a ticket ID
    if (updates.status && ticketId) {
      const service = services.find(s => s.id === serviceId);
      if (service && service.serviceId) {
        reduxDispatch(updateServiceStatusInSupabase({
          ticketId,
          serviceId: service.serviceId,
          newStatus: updates.status as TicketServiceStatus,
          userId: 'current-user',
          deviceId: 'web-browser',
        })).then(() => {
          console.log('✅ Service status persisted:', updates.status);
        }).catch((error) => {
          console.error('❌ Failed to persist service status:', error);
        });
      }
    }
  }, [ticketId, services, dispatch, ticketActions, reduxDispatch]);

  // Remove service with undo support
  const handleRemoveService = useCallback((serviceId: string) => {
    const serviceToRemove = services.find(s => s.id === serviceId);
    if (!serviceToRemove) return;

    const previousServices = [...services];
    dispatch(ticketActions.removeService(serviceId));

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    toast({
      title: 'Service Removed',
      description: `${serviceToRemove.serviceName} removed from ticket`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
          }
          previousServices.forEach(s => {
            if (s.id === serviceId) {
              dispatch(ticketActions.addService([s]));
            }
          });
          toast({
            title: 'Service Restored',
            description: `${serviceToRemove.serviceName} restored to ticket`,
          });
        }}>
          Undo
        </ToastAction>
      ),
    });

    undoTimeoutRef.current = setTimeout(() => {
      undoTimeoutRef.current = null;
    }, 5000);
  }, [services, dispatch, ticketActions, toast]);

  // Reassign staff to service(s)
  const handleReassignStaff = useCallback((serviceIdOrIds: string | string[]) => {
    const ids = Array.isArray(serviceIdOrIds) ? serviceIdOrIds : [serviceIdOrIds];
    dispatch(ticketActions.setReassigningServiceIds(ids));
    dispatch(ticketActions.setFullPageTab('staff'));
  }, [dispatch, ticketActions]);

  // Duplicate services
  const handleDuplicateServices = useCallback((serviceIds: string[]) => {
    dispatch(ticketActions.duplicateServices(serviceIds));
  }, [dispatch, ticketActions]);

  // Add package
  const handleAddPackage = useCallback((
    packageData: {
      id: string;
      name: string;
      description: string;
      services: { serviceId: string; serviceName: string; originalPrice: number; duration?: number }[];
      packagePrice: number;
      validDays: number;
      category: string;
    },
    staffId: string
  ) => {
    const staffMember = staffMembers.find((s) => s.id === staffId);
    if (!staffMember) return;

    const packageServices: TicketService[] = packageData.services.map((service, index) => ({
      id: `pkg-${packageData.id}-${service.serviceId}-${Date.now()}-${index}`,
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      price: service.originalPrice,
      duration: service.duration || 30,
      staffId: staffId,
      staffName: staffMember.name,
      status: 'not_started' as const,
    }));

    const totalOriginalPrice = packageData.services.reduce((sum, s) => sum + s.originalPrice, 0);
    const packageDiscount = totalOriginalPrice - packageData.packagePrice;

    dispatch(ticketActions.addPackage(packageServices, packageDiscount, true));

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    toast({
      title: 'Package Added',
      description: `${packageData.name} added to ${staffMember.name} (saved $${packageDiscount.toFixed(2)})`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
          }
          dispatch(ticketActions.undoLastAction());
        }}>
          Undo
        </ToastAction>
      ),
    });

    undoTimeoutRef.current = setTimeout(() => {
      undoTimeoutRef.current = null;
    }, 5000);
  }, [staffMembers, dispatch, ticketActions, toast]);

  // Add products
  const handleAddProducts = useCallback((
    items: { productId: string; name: string; price: number; quantity: number }[]
  ) => {
    const productServices: TicketService[] = items.flatMap((item) => {
      const products: TicketService[] = [];
      for (let i = 0; i < item.quantity; i++) {
        products.push({
          id: `product-${item.productId}-${Date.now()}-${i}`,
          serviceId: `product-${item.productId}`,
          serviceName: `[Product] ${item.name}`,
          price: item.price,
          duration: 0,
          staffId: undefined,
          status: 'completed' as const,
        });
      }
      return products;
    });

    dispatch(ticketActions.addProducts(productServices, true));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    toast({
      title: 'Products Added',
      description: `${totalItems} product${totalItems !== 1 ? 's' : ''} added ($${totalValue.toFixed(2)})`,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
          }
          dispatch(ticketActions.undoLastAction());
        }}>
          Undo
        </ToastAction>
      ),
    });

    undoTimeoutRef.current = setTimeout(() => {
      undoTimeoutRef.current = null;
    }, 5000);
  }, [dispatch, ticketActions, toast]);

  // Repeat purchase from history
  const handleRepeatPurchase = useCallback((
    items: { id: string; name: string; price: number; staffName: string; type: string }[]
  ) => {
    const repeatedServices: TicketService[] = items.map((item, index) => ({
      id: `repeat-${item.id}-${Date.now()}-${index}`,
      serviceId: item.id,
      serviceName: item.type === 'product' ? `[Product] ${item.name}` : item.name,
      price: item.price,
      duration: item.type === 'product' ? 0 : 30,
      staffId: undefined,
      status: item.type === 'product' ? ('completed' as const) : ('not_started' as const),
    }));

    dispatch(ticketActions.addService(repeatedServices));

    toast({
      title: 'Purchase Repeated',
      description: `${items.length} item${items.length !== 1 ? 's' : ''} added from previous purchase`,
    });
  }, [dispatch, ticketActions, toast]);

  return {
    handleAddServices,
    handleUpdateService,
    handleRemoveService,
    handleReassignStaff,
    handleDuplicateServices,
    handleAddPackage,
    handleAddProducts,
    handleRepeatPurchase,
  };
}
