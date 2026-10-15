import * as v from "valibot";
import { IconSettingsSchema } from "../settings";

export const InsertIconSchema = v.object({
  __type: v.literal("insert-icon"),
  name: v.pipe(v.string(), v.nonEmpty()),
  svg: v.pipe(v.string(), v.nonEmpty()),
  settings: IconSettingsSchema,
});

export type InsertIcon = v.InferOutput<typeof InsertIconSchema>;
