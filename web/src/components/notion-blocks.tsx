/**
 * Renders Notion blocks as HTML.
 *
 * Covers the block types the seeded content actually uses — paragraphs,
 * headings, lists, callouts, quotes, tables, dividers. Anything unrecognised
 * renders its plain text rather than disappearing, so an unexpected block type
 * degrades instead of leaving a hole in a transcript.
 */

import type { NotionBlock } from "@/lib/notion/client";

interface RichText {
  plain_text: string;
  href: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
}

function RichTextSpan({ items }: { items: unknown }) {
  if (!Array.isArray(items)) return null;
  return (
    <>
      {(items as RichText[]).map((item, i) => {
        const a = item.annotations ?? {};
        let node: React.ReactNode = item.plain_text;

        if (a.code) {
          node = (
            <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[0.9em] dark:bg-zinc-800">
              {node}
            </code>
          );
        }
        if (a.bold) node = <strong className="font-semibold">{node}</strong>;
        if (a.italic) node = <em>{node}</em>;
        if (a.strikethrough) node = <s>{node}</s>;
        if (a.underline) node = <u>{node}</u>;
        if (item.href) {
          node = (
            <a
              href={item.href}
              className="underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {node}
            </a>
          );
        }

        return <span key={i}>{node}</span>;
      })}
    </>
  );
}

function text(block: NotionBlock): unknown {
  const body = block[block.type] as { rich_text?: unknown } | undefined;
  return body?.rich_text;
}

/** Consecutive list items are grouped so they render as one list, not many. */
function groupBlocks(blocks: NotionBlock[]): NotionBlock[][] {
  const groups: NotionBlock[][] = [];
  for (const block of blocks) {
    const prev = groups[groups.length - 1];
    const isList =
      block.type === "bulleted_list_item" || block.type === "numbered_list_item";
    if (prev && isList && prev[0].type === block.type) {
      prev.push(block);
    } else {
      groups.push([block]);
    }
  }
  return groups;
}

function Block({ block }: { block: NotionBlock }) {
  switch (block.type) {
    case "paragraph": {
      const items = text(block);
      if (!Array.isArray(items) || items.length === 0) return null;
      return (
        <p className="text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
          <RichTextSpan items={items} />
        </p>
      );
    }

    case "heading_1":
      return (
        <h3 className="mt-8 font-display text-xl tracking-tight">
          <RichTextSpan items={text(block)} />
        </h3>
      );

    case "heading_2":
      return (
        <h3 className="mt-8 font-display text-lg tracking-tight">
          <RichTextSpan items={text(block)} />
        </h3>
      );

    case "heading_3":
      return (
        <h4 className="mt-6 font-display text-base tracking-tight">
          <RichTextSpan items={text(block)} />
        </h4>
      );

    case "quote":
      return (
        <blockquote className="border-l-2 border-zinc-300 pl-4 text-[15px] leading-7 text-zinc-600 italic dark:border-zinc-700 dark:text-zinc-400">
          <RichTextSpan items={text(block)} />
        </blockquote>
      );

    case "callout": {
      const body = block.callout as { icon?: { emoji?: string } } | undefined;
      return (
        <div className="flex gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          {body?.icon?.emoji && (
            <span aria-hidden className="text-base leading-6">
              {body.icon.emoji}
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-1 text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
            <RichTextSpan items={text(block)} />
            {block.children?.map((child) => (
              <div key={child.id}>
                <RichTextSpan items={text(child)} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "divider":
      return <hr className="border-zinc-200 dark:border-zinc-800" />;

    case "table": {
      const rows = block.children ?? [];
      const hasHeader =
        (block.table as { has_row_header?: boolean; has_column_header?: boolean })
          ?.has_column_header ?? false;
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {rows.map((row, rowIndex) => {
                const cells =
                  ((row.table_row as { cells?: unknown[] })?.cells ??
                    []) as unknown[];
                const isHeader = hasHeader && rowIndex === 0;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-200 dark:border-zinc-800"
                  >
                    {cells.map((cell, cellIndex) => {
                      const Cell = isHeader ? "th" : "td";
                      return (
                        <Cell
                          key={cellIndex}
                          className={
                            isHeader
                              ? "px-3 py-2 text-left font-mono text-[10px] font-normal uppercase tracking-wider text-zinc-500"
                              : "px-3 py-2 align-top text-zinc-700 dark:text-zinc-300"
                          }
                        >
                          <RichTextSpan items={cell} />
                        </Cell>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 font-mono text-[12px] text-zinc-100">
          <code>
            <RichTextSpan items={text(block)} />
          </code>
        </pre>
      );

    default: {
      const items = text(block);
      if (!Array.isArray(items) || items.length === 0) return null;
      return (
        <p className="text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
          <RichTextSpan items={items} />
        </p>
      );
    }
  }
}

export function NotionBlocks({ blocks }: { blocks: NotionBlock[] }) {
  const groups = groupBlocks(blocks);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group, i) => {
        const type = group[0].type;

        if (type === "bulleted_list_item" || type === "numbered_list_item") {
          const List = type === "numbered_list_item" ? "ol" : "ul";
          return (
            <List
              key={i}
              className={`flex list-outside flex-col gap-2 pl-5 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300 ${
                type === "numbered_list_item" ? "list-decimal" : "list-disc"
              }`}
            >
              {group.map((block) => (
                <li key={block.id}>
                  <RichTextSpan items={text(block)} />
                </li>
              ))}
            </List>
          );
        }

        return <Block key={group[0].id} block={group[0]} />;
      })}
    </div>
  );
}
