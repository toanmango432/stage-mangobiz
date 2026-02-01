/**
 * Type augmentation for @hookform/resolvers to fix compatibility with Zod v3.25+
 *
 * Zod v3.25 introduced internal type changes that cause zodResolver type mismatches.
 * This declaration overrides the strict typing to allow ZodObject schemas.
 */

import type { ZodSchema, ZodObject, ZodEffects } from 'zod';
import type { FieldValues, ResolverOptions, ResolverResult } from 'react-hook-form';

declare module '@hookform/resolvers/zod' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function zodResolver<T extends FieldValues>(
    schema: ZodSchema<T> | ZodObject<any, any, any> | ZodEffects<any, any, any>,
    schemaOptions?: Partial<any>,
    resolverOptions?: {
      mode?: 'async' | 'sync';
      raw?: boolean;
    }
  ): <TFieldValues extends FieldValues, TContext>(
    values: TFieldValues,
    context: TContext | undefined,
    options: ResolverOptions<TFieldValues>
  ) => Promise<ResolverResult<TFieldValues>>;
}
