import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { usePersonalization } from "@/hooks/usePersonalization";
import { getPersonalizedGreeting, getDaysSinceLastVisit } from "@/lib/ai/personalization";
import heroSalon from "@/assets/hero-salon.jpg";

export function PersonalizedHero() {
  const { isReturningUser } = usePersonalization();
  const greeting = getPersonalizedGreeting();
  const daysSinceVisit = getDaysSinceLastVisit();

  const getSubheading = () => {
    if (isReturningUser && daysSinceVisit >= 14) {
      return "It's been a while! Time to treat yourself to something special.";
    }
    if (isReturningUser) {
      return "Ready for your next appointment?";
    }
    return "Experience the art of beauty with personalized nail care";
  };

  return (
    <div className="relative h-[500px] overflow-hidden rounded-lg">
      <img
        src={heroSalon}
        alt="Luxury nail salon interior"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      
      <div className="relative h-full flex flex-col justify-center px-8 md:px-16 max-w-2xl">
        {isReturningUser && (
          <div className="inline-flex items-center gap-2 mb-4 animate-fade-in">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Personalized for you</span>
          </div>
        )}
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
          {greeting}
        </h1>
        
        <p className="text-lg md:text-xl text-white/90 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {getSubheading()}
        </p>
        
        <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
            {isReturningUser ? 'Book Again' : 'Book Now'}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Browse Services
          </Button>
        </div>
      </div>
    </div>
  );
}
