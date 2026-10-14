import * as v from "valibot";

export const LUCIDE_BASE_SIZE = 24;

export const IconSettingsSchema = v.object({
  /** Width & height of the inserted icon in px. */
  size: v.pipe(v.number(), v.minValue(1), v.maxValue(2048)),
  /** Stroke width in Lucide's 24×24 grid (or in px when absolute). */
  strokeWidth: v.pipe(v.number(), v.minValue(0.25), v.maxValue(10)),
  /** Keep the stroke width the same regardless of the icon size. */
  absoluteStrokeWidth: v.boolean(),
  /** Stroke (and fill of the few filled details) colour, `#RRGGBB`. */
  color: v.pipe(v.string(), v.hexColor()),
});

export type IconSettings = v.InferOutput<typeof IconSettingsSchema>;

export const DEFAULT_SETTINGS: IconSettings = {
  size: LUCIDE_BASE_SIZE,
  strokeWidth: 2,
  absoluteStrokeWidth: false,
  color: "#000000",
};

/** Stroke width in px of an icon inserted with the given settings. */
export function finalStrokeWidth(settings: IconSettings) {
  return settings.absoluteStrokeWidth
    ? settings.strokeWidth
    : (settings.strokeWidth * settings.size) / LUCIDE_BASE_SIZE;
}
