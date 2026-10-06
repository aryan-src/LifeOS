/**
 * Distribute an array of items across N columns in a round-robin order
 * (item 0 -> col 0, item 1 -> col 1, item 2 -> col 2, item 3 -> col 0, etc.)
 * This preserves natural left-to-right chronological reading order when rendered
 * in vertical flex/grid columns.
 */
export function distributeColumns<T>(items: T[], numColumns: number): T[][] {
  if (numColumns <= 1) return [items];

  const columns: T[][] = Array.from({ length: numColumns }, () => []);

  items.forEach((item, index) => {
    columns[index % numColumns].push(item);
  });

  return columns;
}
