import * as v from "valibot";

export const InsertResultSchema = v.object({
  __type: v.literal("insert-result"),
  name: v.string(),
  error: v.optional(v.string()),
});

export type InsertResult = v.InferOutput<typeof InsertResultSchema>;
