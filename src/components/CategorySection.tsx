"use client";

import Link from "next/link";
import ServiceCard from "./ServiceCard";
import { Category, Service } from "@/types";

interface CategorySectionProps {
  category: Category;
  services: Service[];
}

export default function CategorySection({
  category,
  services,
}: CategorySectionProps) {
  if (services.length === 0) return null;

  return (
    <section
      id={`category-${category.slug}`}
      className="scroll-mt-16 md:scroll-mt-20 lg:scroll-mt-24"
    >
      <div className="flex flex-wrap items-center mb-4 pb-2">
        <div className="flex-shrink-0 mr-4">
          <h2 className="font-bold text-2xl text-gray-800 whitespace-nowrap">
            <Link href={`/c/${category.slug}`} className="-space-y-2">
              <span className="relative -top-0.5">{category.name}</span>
              <span className="bg-brand-200 h-2 block w-full"></span>
            </Link>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
