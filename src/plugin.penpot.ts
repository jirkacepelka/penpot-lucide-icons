import * as v from "valibot";
import type { MessageTheme } from "./messages/theme-change.message";
import { InsertIconSchema } from "./messages/insert-icon.message";
import type { InsertResult } from "./messages/insert-result.message";
import { insertIcon } from "./insert-icon.penpot";

penpot.ui.open("Lucide Icons", "", {
  width: 340,
  height: 560,
});

penpot.on("themechange", (theme) =>
  penpot.ui.sendMessage({
    __type: "theme-change",
    theme,
  } satisfies MessageTheme),
);

penpot.ui.onMessage((data) => {
  const message = v.safeParse(InsertIconSchema, data);

  if (!message.success) return;

  const { name, svg, settings } = message.output;
  let error: string | undefined;

  try {
    insertIcon(name, svg, settings);
  } catch (e) {
    console.error(e);
    error = e instanceof Error ? e.message : String(e);
  }

  penpot.ui.sendMessage({ __type: "insert-result", name, error } satisfies InsertResult);
});
