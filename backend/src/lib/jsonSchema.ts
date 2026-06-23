import { z } from "zod";

export const TestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

export function parseJsonColumn<T>(raw: unknown, schema: z.ZodType<T>): T[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const result = schema.safeParse(item);
      return result.success ? result.data : null;
    })
    .filter((item): item is T => item !== null);
}

export function parseJsonColumnOrThrow<T>(
  raw: unknown,
  schema: z.ZodType<T>,
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => schema.parse(item));
}
