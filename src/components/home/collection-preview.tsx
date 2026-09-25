import { ChartNoAxesColumnIncreasing, Layers, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Messages } from "@/lib/i18n/messages";

interface CollectionPreviewProps {
  copy: Messages["collection"];
}

export function CollectionPreview({ copy }: CollectionPreviewProps) {
  const features = [
    { icon: Layers, label: copy.featureOne },
    { icon: Search, label: copy.featureTwo },
    { icon: ChartNoAxesColumnIncreasing, label: copy.featureThree },
  ];

  return (
    <section id="collection" className="scroll-mt-24 py-24 sm:py-32">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-3xl border border-safir/20 bg-[#0b151d] px-6 py-14 text-[#edf2ed] sm:px-12 sm:py-20 lg:px-20">
          <div className="surface-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="pointer-events-none absolute top-1/2 right-[-10rem] size-[34rem] -translate-y-1/2 rounded-full bg-safir/10 blur-3xl" />
          <div className="relative grid gap-14 lg:grid-cols-[1fr_0.92fr] lg:items-end">
            <div className="max-w-2xl">
              <Badge className="rounded-full border border-[#b5d4cf]/15 bg-[#b5d4cf]/10 px-3 text-[#b5d4cf]">
                {copy.badge}
              </Badge>
              <p className="mt-8 text-[0.68rem] font-semibold tracking-[0.24em] text-[#95bbb7] uppercase">
                {copy.eyebrow}
              </p>
              <h2 className="mt-5 font-heading text-5xl leading-[0.92] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
                {copy.title}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#a8b5b6] sm:text-lg">
                {copy.description}
              </p>
            </div>
            <ul className="grid gap-3" aria-label={copy.title}>
              {features.map(({ icon: Icon, label }, index) => (
                <li
                  key={label}
                  className="flex items-center gap-4 border-b border-white/10 py-4 last:border-b-0"
                >
                  <span className="grid size-10 place-items-center rounded-full border border-[#9dc5bf]/20 bg-[#9dc5bf]/5 text-[#9dc5bf]">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium sm:text-base">{label}</span>
                  <span className="font-heading text-sm text-white/35">
                    0{index + 1}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
