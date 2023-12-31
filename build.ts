import { Font, Glyph, Path, type FontConstructorOptions } from "opentype.js";
import arcToBezier from "svg-arc-to-cubic-bezier";
import { makeAbsolute, parseSVG } from "svg-path-parser";
import { get_defnitions } from "./internal/db";

class PathBuilder {
  path = new Path();
  constructor(
    public size: number,
    public scale: number,
    public padding: number
  ) {}
  moveTo(x: number, y: number) {
    this.path.moveTo(
      (x - this.padding) * this.scale,
      (this.size - y - this.padding) * this.scale
    );
  }
  lineTo(x: number, y: number) {
    this.path.lineTo(
      (x - this.padding) * this.scale,
      (this.size - y - this.padding) * this.scale
    );
  }
  curveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number
  ) {
    this.path.curveTo(
      (x1 - this.padding) * this.scale,
      (this.size - y1 - this.padding) * this.scale,
      (x2 - this.padding) * this.scale,
      (this.size - y2 - this.padding) * this.scale,
      (x - this.padding) * this.scale,
      (this.size - y - this.padding) * this.scale
    );
  }
  quadTo(x1: number, y1: number, x: number, y: number) {
    this.path.quadraticCurveTo(
      (x1 - this.padding) * this.scale,
      (this.size - y1 - this.padding) * this.scale,
      (x - this.padding) * this.scale,
      (this.size - y - this.padding) * this.scale
    );
  }
  close() {
    this.path.close();
  }
  generate() {
    return this.path;
  }
}

export function getGeneratedFont({
  name = "iconfont",
  size = 24,
  scale = 100,
  padding = 0,
}: {
  name?: string;
  size?: number;
  scale?: number;
  padding?: number;
} & Partial<
  Omit<
    FontConstructorOptions,
    "familyName" | "unitsPerEm" | "ascender" | "descender"
  >
> = {}) {
  const definitions = get_defnitions.all();
  const notdefGlyph = new Glyph({
    index: 0,
    name: ".notdef",
    advanceWidth: (size - padding * 2) * scale,
    path: new Path(),
  });
  const font = new Font({
    familyName: name,
    unitsPerEm: (size - padding * 2) * scale,
    ascender: (size - padding) * scale,
    descender: -padding * scale,
    glyphs: [
      notdefGlyph,
      ...definitions.map((item) => {
        const path = new PathBuilder(size, scale, padding);
        const parsed = makeAbsolute(parseSVG(item.value));
        for (const [idx, command] of parsed.entries()) {
          switch (command.code) {
            case "A":
              for (const { x1, y1, x2, y2, x, y } of arcToBezier({
                cx: command.x,
                cy: command.y,
                px: command.x0,
                py: command.y0,
                rx: command.rx,
                ry: command.ry,
                xAxisRotation: command.xAxisRotation,
                largeArcFlag: command.largeArc ? 1 : 0,
                sweepFlag: command.sweep ? 1 : 0,
              }))
                path.curveTo(x1, y1, x2, y2, x, y);
              break;
            case "C":
              path.curveTo(
                command.x1,
                command.y1,
                command.x2,
                command.y2,
                command.x,
                command.y
              );
              break;
            case "H":
            case "V":
            case "L":
              path.lineTo(command.x, command.y);
              break;
            case "M":
              path.moveTo(command.x, command.y);
              break;
            case "Q":
              path.quadTo(command.x1, command.y1, command.x, command.y);
              break;
            case "S": {
              const last = parsed[idx - 1];
              if (last?.code !== "C")
                throw new Error("invalid curve: " + item.value);
              const mirrord = mirrorPoint(
                command.x0,
                command.y0,
                last.x2,
                last.y2
              );
              path.curveTo(
                mirrord.x,
                mirrord.y,
                command.x2,
                command.y2,
                command.x,
                command.y
              );
              break;
            }
            case "T": {
              const last = parsed[idx - 1];
              if (last?.code !== "Q")
                throw new Error("invalid curve: " + item.value);
              const mirrord = mirrorPoint(
                command.x0,
                command.y0,
                last.x1,
                last.y1
              );
              path.quadTo(mirrord.x, mirrord.y, command.x, command.y);
              break;
            }
            case "Z":
              path.close();
              break;
          }
        }
        return new Glyph({
          index: item.index,
          name: item.name,
          unicode: item.unicode,
          advanceWidth: (size - padding * 2) * scale,
          path: path.generate(),
        });
      }),
    ],
    styleName: "Regular",
  });
  font.substitution
  return font;
}

function mirrorPoint(x0: number, y0: number, x1: number, y1: number) {
  return { x: x0 - (x1 - x0), y: y0 - (y1 - y0) };
}
