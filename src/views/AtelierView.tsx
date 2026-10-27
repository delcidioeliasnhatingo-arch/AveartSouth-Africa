import React from 'react';
import { Award, Compass, ShieldCheck, MapPin, ArrowRight, Sparkles, Scissors, Feather, Heart } from 'lucide-react';

interface AtelierViewProps {
  onNavigateCatalog: () => void;
}

export const AtelierView: React.FC<AtelierViewProps> = ({ onNavigateCatalog }) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      
      {/* Editorial Header */}
      <div className="max-w-3xl space-y-4">
        <span className="text-xs uppercase tracking-wider text-[#65775D] font-extrabold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Our Story & Craft</span>
        </span>
        <h1 className="text-4xl sm:text-5xl text-slate-900 font-black leading-tight [text-wrap:balance]">
          Thoughtfully tailored fashion made for real life.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-medium">
          AVEART is a contemporary South African fashion studio headquartered in Cape Town. We create enduring wardrobe staples for women and men, prioritizing breathable natural fibers, honest pricing, and timeless comfort.
        </p>
      </div>

      {/* Showcase Image */}
      <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <img
          src="/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg"
          alt="AVEART Cape Town fashion studio design workbench"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#65775D] tracking-wider">Cape Town Design Studio</span>
            <p className="text-sm font-bold text-slate-900">Tailoring & Pattern Cutting Workshop · Kloof Street</p>
          </div>
          <button
            onClick={onNavigateCatalog}
            className="bg-[#87977D] hover:bg-[#65775D] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Shop Collection →
          </button>
        </div>
      </div>

      {/* 3 Foundational Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#65775D] flex items-center justify-center">
            <Feather className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            01. Pure Natural Fibers
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            We prioritize breathable European flax linen, GOTS-certified organic cotton, and responsibly sourced mulberry silks that wear softer with every wash.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#65775D] flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            02. Thoughtful Tailoring
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Each silhouette is pattern-cut to flatter South African everyday lifestyles—designed with relaxed drape, reinforced french seams, and practical pockets.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#65775D] flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            03. Accessible Retail
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            By designing and fulfilling directly without distributor markups, we deliver luxury-grade fashion at honest South African prices.
          </p>
        </div>
      </div>

      {/* Studio Visitation */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 border border-rose-100 p-8 md:p-12 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-sm">
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-1.5 text-xs text-[#65775D] font-extrabold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Cape Town Flagship</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">
            Visit Our Kloof Street Fitting Studio
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Try on our current seasonal collection, get personal sizing advice, or pick up your online order in person at 14 Kloof Street, Tamboerskloof, Cape Town.
          </p>
        </div>

        <button
          onClick={onNavigateCatalog}
          className="bg-[#87977D] hover:bg-[#65775D] text-white px-8 py-3.5 text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap self-start md:self-auto cursor-pointer"
        >
          Explore Collection →
        </button>
      </div>

    </div>
  );
};
