import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GiftsSection } from "@/components/GiftsSection";
import { LocationSection } from "@/components/LocationSection";
import { RsvpSection } from "@/components/RsvpSection";
import { AboutSection } from "@/components/AboutSection";
import { TimelineSection } from "@/components/TimelineSection";
import { PhotoUploadSection } from "@/components/PhotoUploadSection";
import { TrajeSection } from "@/components/TrajeSection";
import { HeroBackgroundCarousel } from "@/components/HeroBackgroundCarousel";
import Monograma from "@/components/monograma";

import presentesData from "@/data/presentes.json";
import programacaoData from "@/data/programacao.json";
import sobreNosData from "@/data/sobre-nos.json";

export default function Home() {
    return (
        <>
            <Navbar />
            <main id="main">
                {/* 1. Home — carrossel + countdown */}
                <section id="home" className="bg-white">
                    <div className="relative h-[58dvh] min-h-[320px] overflow-hidden sm:h-[64dvh] md:h-[70dvh]">
                        <HeroBackgroundCarousel />
                        <div className="pointer-events-none absolute inset-0 bg-white/20" />
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
                            <h2 className="sr-only">Neto & Mariah</h2>
                            <Monograma
                                solid
                                simple
                                animate={false}
                                ariaHidden
                                className="h-36 w-36 bg-navy sm:h-44 sm:w-44 md:h-52 md:w-52"
                            />
                            <p className="mt-1.5 font-heading text-lg font-medium tracking-wide text-navy sm:mt-2 sm:text-xl md:text-2xl">
                                13 de março de 2027
                            </p>
                        </div>
                    </div>

                    <div className="px-4 py-10 text-center sm:py-12 md:py-14">
                        <p className="mx-auto max-w-xl text-base leading-relaxed text-olive sm:text-lg">
                            Estamos contando os dias para celebrar esse momento
                            com você.
                        </p>
                        <div className="mt-8 md:mt-10">
                            <CountdownTimer />
                        </div>
                    </div>
                </section>

                {/* 2. O Grande Dia */}
                <section
                    id="grande-dia"
                    className="bg-white px-4 py-16 md:py-20 lg:py-24"
                >
                    <TimelineSection events={programacaoData} />
                </section>

                {/* 3. Nossa História */}
                <section
                    id="nossa-historia"
                    className="bg-white px-4 py-12 md:py-16 lg:py-20"
                >
                    <AboutSection content={sobreNosData} />
                </section>

                {/* 4. Local */}
                <section
                    id="local"
                    className="bg-white px-4 py-16 md:py-20 lg:py-24"
                >
                    <LocationSection />
                </section>

                {/* 5. Traje */}
                <section
                    id="traje"
                    className="bg-white px-4 py-16 md:py-20 lg:py-24"
                >
                    <TrajeSection />
                </section>

                {/* 6. Presentes */}
                <section
                    id="presentes"
                    className="bg-white px-4 py-16 md:py-20 lg:py-24"
                >
                    <GiftsSection
                        presents={presentesData.map(
                            ({ chavePix: _chavePix, ...p }) => p,
                        )}
                    />
                </section>

                {/* 7. Confirmação */}
                <section
                    id="confirmacao"
                    className="bg-white px-4 py-16 md:py-20 lg:py-24"
                >
                    <RsvpSection />
                </section>

                {/* 8. Fotos (fora do menu) */}
                <section
                    id="fotos"
                    className="bg-white px-4 py-16 md:py-20 lg:py-24"
                >
                    <PhotoUploadSection />
                </section>
            </main>
            <Footer />
        </>
    );
}
