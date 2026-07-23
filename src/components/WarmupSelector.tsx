import { WARMUP_CATALOGUE } from "../exercise/warmupCatalogue";

interface WarmupSelectorProps {
  selectedWarmupTitle: string;
  onWarmupChange: (title: string) => void;
}

export function WarmupSelector({ selectedWarmupTitle, onWarmupChange }: WarmupSelectorProps) {
  const warmup = WARMUP_CATALOGUE.find(({ title }) => title === selectedWarmupTitle) ?? WARMUP_CATALOGUE[0];
  return (
    <section className="warmup-selector" aria-labelledby="warmup-heading">
      <span className="warmup-selector__label" id="warmup-heading">Warm-up</span>
      <label className="warmup-selector__field" htmlFor="warmup">
        <select id="warmup" value={warmup.title} onChange={(event) => onWarmupChange(event.target.value)}>
          {WARMUP_CATALOGUE.map((item) => <option key={item.title} value={item.title}>{item.title}</option>)}
        </select>
      </label>
      <p>{warmup.description}</p>
    </section>
  );
}
