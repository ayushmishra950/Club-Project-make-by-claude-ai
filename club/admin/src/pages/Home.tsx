import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { AboutSection } from "@/components/home/AboutSection";
import { WhyJoinSection } from "@/components/home/WhyJoinSection";
import { ImpactSection } from "@/components/home/ImpactSection";
import { EventsPreviewSection } from "@/components/home/EventsPreviewSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { LeadershipSection } from "@/components/home/LeadershipSection";
import { GallerySection } from "@/components/home/GallerySection";
import { AnnouncementsSection } from "@/components/home/AnnouncementsSection";
import { NewsSection } from "@/components/home/NewsSection";
import { CTASection } from "@/components/home/CTASection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <LeadershipSection />
      <EventsPreviewSection />
      <GallerySection />
      <AboutSection />
      <WhyJoinSection />
      <ImpactSection />
      <TestimonialsSection />
      <AnnouncementsSection />
      <NewsSection />
      <CTASection />
    </div>
  );
}
