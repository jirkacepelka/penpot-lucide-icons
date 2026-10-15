import type { Board, Shape } from "@penpot/plugin-types";
import {
  finalStrokeWidth,
  LUCIDE_BASE_SIZE,
  type IconSettings,
} from "./settings";

/** Plugin data key marking boards created by this plugin. */
export const ICON_DATA_KEY = "lucide-icon";

const GAP = 8;

function walk(shape: Shape, fn: (shape: Shape) => void) {
  fn(shape);
  if ("children" in shape && shape.children) {
    for (const child of shape.children) walk(child, fn);
  }
}

function isLucideIcon(shape: Shape) {
  // getPluginData returns null (despite the typings) or "" when unset.
  return shape.type === "board" && !!shape.getPluginData(ICON_DATA_KEY);
}

/**
 * Converts a Lucide SVG into a Penpot board named after the icon, with the
 * requested size, colour and stroke width.
 *
 * `createShapeFromSvg` ignores the SVG `width`/`height` (it uses the viewBox)
 * and never scales stroke widths or corner radii, so all of that is applied
 * here after the import.
 */
export function createIcon(name: string, svg: string, settings: IconSettings): Board {
  const group = penpot.createShapeFromSvg(
    svg.replaceAll("currentColor", settings.color),
  );

  if (!group || group.type !== "group") {
    group?.remove();
    throw new Error(`Penpot couldn't import the SVG of "${name}"`);
  }

  const scale = settings.size / LUCIDE_BASE_SIZE;
  const strokeWidth = finalStrokeWidth(settings);

  // Radii have to be read before resizing, resize doesn't scale them.
  const radii = new Map<string, number>();
  walk(group, (shape) => {
    if (shape.type === "rectangle" && shape.borderRadius) {
      radii.set(shape.id, shape.borderRadius);
    }
  });

  if (scale !== 1) {
    group.resize(settings.size, settings.size);
  }

  const icon = penpot.createBoard();
  icon.name = name;
  icon.resize(settings.size, settings.size);
  icon.x = group.x;
  icon.y = group.y;
  icon.fills = [];
  icon.clipContent = false;
  icon.setPluginData(ICON_DATA_KEY, name);

  for (const child of [...group.children]) {
    // Penpot adds a hidden "base-background" rectangle for the viewBox.
    if (child.hidden) {
      child.remove();
      continue;
    }

    walk(child, (shape) => {
      if (shape.strokes.length > 0) {
        shape.strokes = shape.strokes.map((stroke) => ({ ...stroke, strokeWidth }));
      }

      const radius = radii.get(shape.id);
      if (radius !== undefined) {
        shape.borderRadius = radius * scale;
      }
    });

    icon.appendChild(child);
  }

  // Penpot deletes the group automatically once its last child is moved out
  // (touching `group` after that throws).
  return icon;
}

function center(shape: Shape, x: number, y: number) {
  shape.x = Math.round(x - shape.width / 2);
  shape.y = Math.round(y - shape.height / 2);
}

function insertAfter(target: Shape, shape: Shape) {
  const parent = target.parent;

  if (parent && "insertChild" in parent) {
    parent.insertChild(target.parentIndex + 1, shape);
  }
}

/**
 * Places the icon like the Lucide Figma plugin does:
 * - selected board → inside of it (centered, or appended to its flex/grid layout)
 * - selected Lucide icon → next to it, so sets can be built quickly
 * - any other selected shape → centered on top of it
 * - nothing selected → center of the viewport
 */
export function placeIcon(icon: Board, selection: Shape[]) {
  const target = selection.find((shape) => shape.id !== icon.id);

  if (!target) {
    center(icon, penpot.viewport.center.x, penpot.viewport.center.y);
    return;
  }

  if (isLucideIcon(target)) {
    insertAfter(target, icon);
    if (!target.parent || !("flex" in target.parent && (target.parent.flex || target.parent.grid))) {
      icon.x = Math.round(target.x + target.width + GAP);
      icon.y = Math.round(target.y + (target.height - icon.height) / 2);
    }
    return;
  }

  if (target.type === "board") {
    target.appendChild(icon);
    if (!target.flex && !target.grid) {
      center(icon, target.x + target.width / 2, target.y + target.height / 2);
    }
    return;
  }

  insertAfter(target, icon);
  center(icon, target.x + target.width / 2, target.y + target.height / 2);
}

export function insertIcon(name: string, svg: string, settings: IconSettings) {
  const selection = penpot.selection;
  const undoBlock = penpot.history.undoBlockBegin();

  try {
    const icon = createIcon(name, svg, settings);
    placeIcon(icon, selection);
    penpot.selection = [icon];
    return icon;
  } finally {
    penpot.history.undoBlockFinish(undoBlock);
  }
}
