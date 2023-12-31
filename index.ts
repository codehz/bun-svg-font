import { insert_definition } from "./internal/db";
export function createIconfont(
  definitions: Record<string, string>
): Record<string, string> {
  const values = insert_definition.all(
    JSON.stringify(
      Object.entries(definitions).map(([name, value]) => ({ name, value }))
    )
  );
  return Object.fromEntries(
    Object.keys(definitions).map((key, idx) => {
      return [key, values[idx].text];
    })
  );
}
