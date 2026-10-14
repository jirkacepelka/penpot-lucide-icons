import lucide from "$lib/lucide.json" with { type: "json" };

export type IndexTableItem = (typeof lucide.icons)[number];

export const indexTable: IndexTableItem[] = lucide.icons;

export const lucideVersion: string = lucide.version;
