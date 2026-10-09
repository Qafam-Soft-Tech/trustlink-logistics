import { useState } from 'react';
import { useAdminData } from '../data/AdminDataContext';
import { NGN } from '../data/types';
import { Feedback, PageHeader, Panel } from '../components/ui';

const SAMPLE = { distanceKm: 4, weightKg: 2 };

export function PricingPage() {
  const { state, updatePricing } = useAdminData();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const value = (key: string): number => {
    const raw = drafts[key];
    const parsed = raw === undefined ? state.pricing.find((p) => p.key === key)?.value ?? 0 : Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const preview = (() => {
    const base = value('base_fare');
    const perKm = value('per_km_rate');
    const perKg = value('per_kg_rate');
    const minimum = value('minimum_fare');
    const weightMultiplier = SAMPLE.weightKg <= value('weight_tier_1_max') ? value('weight_tier_1_multiplier')
      : SAMPLE.weightKg <= value('weight_tier_2_max') ? value('weight_tier_2_multiplier')
        : SAMPLE.weightKg <= value('weight_tier_3_max') ? value('weight_tier_3_multiplier')
          : value('weight_tier_4_multiplier');
    const bandMultiplier = SAMPLE.distanceKm <= value('distance_band_1_max') ? value('distance_band_1_multiplier')
      : SAMPLE.distanceKm <= value('distance_band_2_max') ? value('distance_band_2_multiplier')
        : value('distance_band_3_multiplier');
    const subtotal = base + SAMPLE.distanceKm * perKm * bandMultiplier + SAMPLE.weightKg * perKg * weightMultiplier;
    return Math.max(subtotal, minimum);
  })();

  const save = () => {
    setError(null);
    const changed = Object.entries(drafts).filter(([, raw]) => raw.trim() !== '');
    if (changed.length === 0) {
      setError('Change at least one value before saving.');
      return;
    }
    for (const [key, raw] of changed) {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError(`${key} must be a positive number.`);
        return;
      }
    }
    for (const [key] of changed) updatePricing(key, value(key));
    setDrafts({});
    setMessage(`${changed.length} pricing value${changed.length === 1 ? '' : 's'} updated.`);
  };

  return (
    <div>
      <PageHeader
        title="Pricing"
        subtitle="Real pricing keys used by the fare engine (base, distance, weight tiers and distance bands)."
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => { setDrafts({}); setMessage(null); setError(null); }}>Discard changes</button>
            <button className="btn btn-primary" onClick={save}>Save changes</button>
          </>
        }
      />
      <Feedback message={message} />
      {error ? (
        <div className="card" style={{ padding: 'var(--spacing-sm) var(--spacing-md)', borderLeft: '4px solid var(--color-error)', marginBottom: 'var(--spacing-md)' }}>
          {error}
        </div>
      ) : null}

      <Panel title="Fare preview">
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          A {SAMPLE.distanceKm} km, {SAMPLE.weightKg} kg parcel would cost <strong>{NGN(preview)}</strong> with the values below
          (base + distance × band multiplier + weight × tier multiplier, floored at the minimum fare).
        </p>
      </Panel>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Key</th><th>Description</th><th>Current</th><th>New value</th></tr>
            </thead>
            <tbody>
              {state.pricing.map((config) => (
                <tr key={config.key}>
                  <td><code>{config.key}</code></td>
                  <td>{config.description}</td>
                  <td>{config.value}</td>
                  <td>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={drafts[config.key] ?? ''}
                      placeholder={String(config.value)}
                      onChange={(event) => setDrafts((prev) => ({ ...prev, [config.key]: event.target.value }))}
                      style={{ maxWidth: 160 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
