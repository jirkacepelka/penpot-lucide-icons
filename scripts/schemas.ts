import * as v from "valibot";

// Only the fields we actually use are validated, and loosely, so that new
// categories or deprecation reasons in upstream Lucide don't silently drop icons.
export const IconAliasSchema = v.union([
  v.string(),
  v.object({ name: v.string() }),
]);

export const LucideIconSchema = v.object({
  aliases: v.optional(v.array(IconAliasSchema)),
  categories: v.optional(v.array(v.string()), []),
  tags: v.optional(v.array(v.string()), []),
  deprecated: v.optional(v.boolean()),
});

export type LucideIcon = v.InferOutput<typeof LucideIconSchema>;
