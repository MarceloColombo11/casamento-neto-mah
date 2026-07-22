"use client";

import { MapPin, Phone } from "lucide-react";
import venueData from "@/data/venue.json";
import { InstagramEmbeds } from "./InstagramEmbeds";
import { MapWidget } from "./MapWidget";

export function LocationSection() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-center">
        <h2 className="font-heading text-3xl font-semibold text-brown md:text-4xl">
          Local
        </h2>
        <p className="mt-4 text-olive">Onde celebraremos nosso amor</p>
      </div>

      <div className="flex flex-col gap-12">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="font-heading text-2xl font-semibold text-brown">
              {venueData.nome}
            </h3>
            <div className="mt-4 space-y-4 text-olive/90 leading-relaxed">
              {venueData.descricao.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-3">
                <MapPin className="size-5 shrink-0 text-sage" />
                <p className="text-olive/90">{venueData.endereco}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Phone className="size-5 shrink-0 text-sage" />
                <a
                  href={`tel:+55${venueData.telefone.replace(/\D/g, "")}`}
                  className="text-olive/90 transition-colors hover:text-sage"
                >
                  {venueData.telefone}
                </a>
              </div>
            </div>
          </div>

          <MapWidget />
        </div>

        <div className="space-y-8">
          <a
            href={venueData.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4 rounded-xl border border-olive/20 bg-cream/50 p-8 transition-opacity hover:opacity-80"
            aria-label="Ver perfil do local no Instagram"
          >
            <div className="flex size-20 shrink-0 overflow-hidden rounded-full bg-cream shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
              <img
                src={venueData.logo}
                alt={venueData.nome}
                className="size-full object-cover"
              />
            </div>
            <div className="text-center">
              <p className="font-medium text-brown">@{venueData.instagramHandle}</p>
              <p className="mt-1 text-sm text-olive">
                Confira fotos e novidades
              </p>
            </div>
          </a>
          <div>
            <h4 className="mb-4 font-heading text-lg font-semibold text-brown text-center">
              Publicações do local
            </h4>
            <InstagramEmbeds />
          </div>
        </div>
      </div>
    </div>
  );
}
