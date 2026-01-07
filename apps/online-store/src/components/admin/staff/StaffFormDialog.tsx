import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  services: string[];
  status: string;
}

interface StaffFormDialogProps {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (staff: Partial<StaffMember>) => void;
}

const availableServices = [
  "Haircut & Styling",
  "Hair Coloring",
  "Manicure",
  "Pedicure",
  "Facial",
  "Massage",
  "Waxing",
];

export function StaffFormDialog({ staff, open, onOpenChange, onSave }: StaffFormDialogProps) {
  const [formData, setFormData] = useState({
    name: staff?.name || "",
    email: staff?.email || "",
    phone: staff?.phone || "",
    role: staff?.role || "Stylist",
    services: staff?.services || [],
    status: staff?.status || "active",
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    onSave(formData);
    toast.success(staff ? "Staff member updated" : "Staff member added");
    onOpenChange(false);
  };

  const toggleService = (service: string) => {
    setFormData({
      ...formData,
      services: formData.services.includes(service)
        ? formData.services.filter((s) => s !== service)
        : [...formData.services, service],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stylist">Stylist</SelectItem>
                  <SelectItem value="Nail Technician">Nail Technician</SelectItem>
                  <SelectItem value="Esthetician">Esthetician</SelectItem>
                  <SelectItem value="Massage Therapist">Massage Therapist</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Services</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableServices.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={formData.services.includes(service)}
                    onCheckedChange={() => toggleService(service)}
                  />
                  <label
                    htmlFor={service}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {service}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="status">Active Status</Label>
            <Switch
              id="status"
              checked={formData.status === "active"}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, status: checked ? "active" : "inactive" })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{staff ? "Update" : "Add"} Staff Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
