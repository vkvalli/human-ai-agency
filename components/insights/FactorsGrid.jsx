import FactorCard from "./FactorCard";
import SectionHeader from "../common/SectionHeader";

export default function FactorsGrid({ items }) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Agency Index Factor Cards"
        description="Top factors affecting decision ownership and agency quality."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <FactorCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}