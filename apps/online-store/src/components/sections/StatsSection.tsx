import { TrendingUp, Users, Star, Calendar } from "lucide-react";

interface StatsSectionProps {
  title?: string;
  stats?: {
    clients?: number;
    services?: number;
    satisfaction?: number;
    experience?: number;
  };
}

export function StatsSection({ 
  title,
  stats = {
    clients: 500,
    services: 5000,
    satisfaction: 98,
    experience: 10
  }
}: StatsSectionProps) {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
      <div className="container mx-auto">
        {title && (
          <h2 className="text-4xl font-bold text-center mb-12">{title}</h2>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-5xl font-bold text-primary mb-2">
              {stats.clients}+
            </p>
            <p className="text-muted-foreground font-medium">Happy Clients</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-8 h-8 text-accent" />
            </div>
            <p className="text-5xl font-bold text-accent mb-2">
              {stats.services.toLocaleString()}+
            </p>
            <p className="text-muted-foreground font-medium">Services Completed</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <p className="text-5xl font-bold text-primary mb-2">
              {stats.satisfaction}%
            </p>
            <p className="text-muted-foreground font-medium">Satisfaction Rate</p>
          </div>

          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
            <p className="text-5xl font-bold text-accent mb-2">
              {stats.experience}+
            </p>
            <p className="text-muted-foreground font-medium">Years Experience</p>
          </div>
        </div>
      </div>
    </section>
  );
}
