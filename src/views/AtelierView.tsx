import React from 'react';
import portraitImage from '../assets/images/Retrato urbano em tons neutros.png';
import { ArrowRight, Shirt, Footprints, ShoppingBag } from 'lucide-react';

interface AtelierViewProps {
  onNavigateCatalog: () => void;
}

export const AtelierView: React.FC<AtelierViewProps> = ({ onNavigateCatalog }) => (
  <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-14">
    <section className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
      <div className="space-y-5">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-neutral-500">AVEART · STYLE EDITION</p>
        <h1 className="text-4xl sm:text-5xl text-neutral-950 font-medium leading-[1.05] tracking-tight">
          Style, your way.
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 leading-8">
          AVEART is a contemporary fashion store bringing together clothing, footwear and accessories for different moments and personal styles.
        </p>
        <p className="text-sm text-neutral-600 leading-8">
          Our point of view is modern, sophisticated, minimalist and fashion-forward. We believe getting dressed should feel straightforward: find the pieces you like, make them your own and wear them your way.
        </p>
        <button onClick={onNavigateCatalog} className="inline-flex items-center gap-3 bg-black px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-neutral-700">
          Explore the collection <ArrowRight size={15} />
        </button>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <img src={portraitImage} alt="AVEART Style Edition fashion editorial" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      </div>
    </section>

    <section className="border-y border-neutral-200 py-10 md:py-12">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-neutral-500">Our point of view</p>
        <h2 className="mt-3 text-3xl md:text-4xl font-medium tracking-tight text-neutral-950">Modern. Sophisticated. Minimal.</h2>
        <p className="mt-4 text-sm leading-7 text-neutral-600">
          A flexible approach to fashion, with clothing, footwear and accessories brought together in one place.
        </p>
      </div>
      <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-7">
        <div className="space-y-3 text-center">
          <Shirt className="mx-auto h-6 w-6 text-neutral-800" strokeWidth={1.4} />
          <h3 className="text-sm font-semibold text-neutral-950">Clothing</h3>
          <p className="text-xs leading-6 text-neutral-600">Everyday pieces, coordinated looks and styles for different occasions.</p>
        </div>
        <div className="space-y-3 text-center">
          <Footprints className="mx-auto h-6 w-6 text-neutral-800" strokeWidth={1.4} />
          <h3 className="text-sm font-semibold text-neutral-950">Footwear</h3>
          <p className="text-xs leading-6 text-neutral-600">Shoes and sneakers to complete your everyday rotation.</p>
        </div>
        <div className="space-y-3 text-center">
          <ShoppingBag className="mx-auto h-6 w-6 text-neutral-800" strokeWidth={1.4} />
          <h3 className="text-sm font-semibold text-neutral-950">Accessories</h3>
          <p className="text-xs leading-6 text-neutral-600">Finishing touches that bring an outfit together.</p>
        </div>
      </div>
    </section>
  </div>
);
