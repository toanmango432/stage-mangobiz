import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { toast } from "sonner";
import { DateRangePicker } from "./DateRangePicker";
import { DateRange } from "react-day-picker";

interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportOptionsDialog({ open, onOpenChange }: ExportOptionsDialogProps) {
  const [selectedData, setSelectedData] = useState<string[]>(["revenue", "bookings"]);
  const [format, setFormat] = useState("csv");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const dataOptions = [
    { id: "revenue", label: "Revenue Data" },
    { id: "bookings", label: "Bookings Data" },
    { id: "customers", label: "Customer Data" },
    { id: "orders", label: "Order Data" },
    { id: "inventory", label: "Inventory Data" },
  ];

  const toggleData = (id: string) => {
    setSelectedData((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    if (selectedData.length === 0) {
      toast.error("Please select at least one data type");
      return;
    }

    // Simulate export
    toast.success(`Exporting ${selectedData.length} data types as ${format.toUpperCase()}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="mb-3 block">Date Range</Label>
            <DateRangePicker onRangeChange={setDateRange} />
          </div>

          <div>
            <Label className="mb-3 block">Select Data to Export</Label>
            <div className="space-y-2">
              {dataOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={selectedData.includes(option.id)}
                    onCheckedChange={() => toggleData(option.id)}
                  />
                  <label
                    htmlFor={option.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (Excel compatible)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel">Excel (.xlsx)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF Report</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Download Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
