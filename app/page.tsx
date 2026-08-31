import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GiftsSection } from "@/components/GiftsSection";
import { LocationSection } from "@/components/LocationSection";
import { RsvpSection } from "@/components/RsvpSection";
import { AboutSection } from "@/components/AboutSection";
import { GrandeDiaSection } from "@/components/GrandeDiaSection";
import { TimelineSection } from "@/components/TimelineSection";
import { TrajeSection } from "@/components/TrajeSection";
import { HeroBackgroundCarousel } from "@/components/HeroBackgroundCarousel";
import Monograma from "@/components/monograma";

import presentesData from "@/data/presentes.json";
import programacaoData from "@/data/programacao.json";
import sobreNosData from "@/data/sobre-nos.json";

export default function Home() {
    return (
        <>
            <main id="main">
                {/* 1. Home — carrossel + countdown */}
                <section id="home" className="relative bg-white">
                    <Navbar />
                    <div className="relative h-[85dvh] min-h-90 overflow-hidden sm:h-[90dvh] md:h-dvh">
                        <HeroBackgroundCarousel />
                        <div className="pointer-events-none absolute inset-0 bg-white/20" />
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
                            <h1 className="sr-only">Neto & Mariah</h1>
                            <Monograma
                                animate={false}
                                ariaHidden
                                className="h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52"
                            />
                        </div>
                    </div>

                    <div className="px-4 py-10 text-center sm:py-12 md:py-14">
                        <p className="font-heading text-[1.35rem] font-bold tracking-[0.28em] text-gold sm:text-[1.5rem] md:text-[1.8rem]">
                            13 · 03 · 2027
                        </p>
                        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-olive sm:mt-5 sm:text-lg">
                            Estamos contando os dias para celebrar esse momento
                            com você!
                        </p>
                        <div className="mt-8 md:mt-10">
                            <CountdownTimer />
                        </div>
                    </div>
                </section>

                {/* 2. O Grande Dia (intro + programação) */}
                <section id="grande-dia" className="bg-white">
                    <div className="px-4 py-16 md:py-20 lg:py-24">
                        <GrandeDiaSection />
                    </div>
                    <div className="px-4 py-16 md:py-20 lg:py-24">
                        <TimelineSection events={programacaoData} />
                    </div>
                </section>

                {/* 3. Local */}
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

                {/* 6. Nossa História */}
                <section
                    id="nossa-historia"
                    className="bg-white px-4 py-12 md:py-16 lg:py-20"
                >
                    <AboutSection content={sobreNosData} />
                </section>

                {/* 7. Lista de presentes */}
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

                {/* 8. Confirmação */}
                <section
                    id="confirmacao"
                    className="bg-white px-4 py-16 md:py-20 lg:py-24"
                >
                    <RsvpSection />
                </section>
            </main>
            <Footer />
        </>
    );
}
