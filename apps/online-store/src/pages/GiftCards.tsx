import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GiftCardDesignSelector } from "@/components/giftcards/GiftCardDesignSelector";
import { GiftCardScheduler } from "@/components/giftcards/GiftCardScheduler";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { getGiftCardDesigns, getGiftCardConfig } from "@/lib/api/store";
import { getGiftCardImage } from "@/lib/images";

const GiftCards = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [amount, setAmount] = useState("50");
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDesign, setSelectedDesign] = useState("gc_classic");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  
  const [designs, setDesigns] = useState<Array<any>>([]);
  const [config, setConfig] = useState<any>(null);
  const [presetAmounts, setPresetAmounts] = useState(["25", "50", "100", "150"]);

  useEffect(() => {
    const loadData = async () => {
      const [designsData, configData] = await Promise.all([
        getGiftCardDesigns(),
        getGiftCardConfig()
      ]);
      setDesigns(designsData);
      if (configData) {
        setConfig(configData);
        setPresetAmounts(configData.presetAmounts.map((a: number) => a.toString()) || ["25", "50", "100", "150"]);
      }
    };
    loadData();
  }, []);

  const handleAddToCart = () => {
    const finalAmount = customAmount || amount;

    if (!finalAmount || parseFloat(finalAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!recipientName || !recipientEmail) {
      toast.error("Please enter recipient details");
      return;
    }

    addToCart({
      id: `giftcard-${Date.now()}`,
      type: 'gift-card',
      name: "Gift Card",
      price: parseFloat(finalAmount),
      giftCardDetails: {
        recipientName,
        recipientEmail,
        message,
        design: selectedDesign,
      }
    });

    toast.success("Gift card added to cart!");
    navigate('/cart');
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Gift Cards</h1>
            <p className="text-lg text-muted-foreground">
              Give the gift of beauty and relaxation. Our gift cards are perfect for any occasion.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customize Your Gift Card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount Selection */}
                  <div className="space-y-3">
                    <Label>Select Amount</Label>
                    <RadioGroup value={amount} onValueChange={setAmount}>
                      <div className="grid grid-cols-2 gap-3">
                        {presetAmounts.map((preset) => (
                          <label
                            key={preset}
                            className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                              amount === preset
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem
                              value={preset}
                              id={`amount-${preset}`}
                              className="sr-only"
                            />
                            <span className="text-2xl font-bold">${preset}</span>
                          </label>
                        ))}
                      </div>
                    </RadioGroup>

                    <div className="space-y-2">
                      <Label htmlFor="custom-amount">Or Enter Custom Amount</Label>
                      <Input
                        id="custom-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min="10"
                        max="500"
                      />
                    </div>
                  </div>

                  {/* Design Selection */}
                  <GiftCardDesignSelector
                    value={selectedDesign}
                    onChange={setSelectedDesign}
                    designs={designs}
                  />

                  {/* Recipient Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient-name">Recipient Name</Label>
                      <Input
                        id="recipient-name"
                        placeholder="Enter recipient's name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipient-email">Recipient Email</Label>
                      <Input
                        id="recipient-email"
                        type="email"
                        placeholder="Enter recipient's email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Personal Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Write a personal message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Delivery Options */}
                  <GiftCardScheduler
                    onScheduleChange={(scheduled, date) => {
                      setScheduledDate(date);
                    }}
                  />

                  <Button onClick={handleAddToCart} className="w-full" size="lg">
                    Add to Cart - ${customAmount || amount}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gift Card Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                      <img
                        src={getGiftCardImage(selectedDesign)}
                        alt="Gift Card Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-6 text-center">
                          <p className="text-4xl font-bold mb-2">
                            ${customAmount || amount}
                          </p>
                          <p className="text-sm text-muted-foreground">Gift Card Value</p>
                        </div>
                      </div>
                    </div>

                    {recipientName && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">For:</p>
                        <p className="font-medium">{recipientName}</p>
                      </div>
                    )}

                    {message && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Message:</p>
                        <p className="text-sm italic">&ldquo;{message}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Gift Card Details</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Can be used for all services and products</li>
                    <li>• No expiration date</li>
                    <li>• Fully transferable</li>
                    <li>• Delivered via email instantly or on scheduled date</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCards;
