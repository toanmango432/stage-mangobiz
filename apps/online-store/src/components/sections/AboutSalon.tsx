import { IMAGES } from "@/lib/images";

interface AboutSalonProps {
  title?: string;
  story?: string;
  mission?: string;
  image?: string;
  yearEstablished?: string;
}

export function AboutSalon({
  title = "Our Story",
  story = "Mango Salon has been serving the community with exceptional beauty services since our founding. We're passionate about making every client feel beautiful and confident.",
  mission = "Our mission is to provide premium beauty services in a welcoming, luxurious environment while staying committed to sustainability and customer satisfaction.",
  image = IMAGES.heroSalon,
  yearEstablished = "2014"
}: AboutSalonProps) {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <img
              src={image}
              alt="Mango Salon Interior"
              className="rounded-lg shadow-xl w-full h-[400px] object-cover"
            />
            {yearEstablished && (
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground px-8 py-4 rounded-lg shadow-lg">
                <p className="text-sm font-medium">Established</p>
                <p className="text-3xl font-bold">{yearEstablished}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold">{title}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">{story}</p>
            
            {mission && (
              <div className="bg-muted/50 p-6 rounded-lg border-l-4 border-primary">
                <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
                <p className="text-muted-foreground">{mission}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
