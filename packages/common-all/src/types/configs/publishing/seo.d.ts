import { z } from "../../../parse";
/**
 * Namespace for SEO related site configurations.
 */
export type SEOConfig = {
    title?: string | undefined;
    description?: string | undefined;
    author?: string | undefined;
    twitter?: string | undefined;
    image?: SEOImage | undefined;
};
export type SEOImage = {
    url: string;
    alt: string;
};
/**
 * Generate default {@link SEOConfig}
 * @returns SEOConfig
 */
export declare function genDefaultSEOConfig(): SEOConfig;
/**
 * `zod` schema to be used with `parse.ts` for validation.
 */
export declare const seoSchema: z.ZodObject<{
    title: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    author: z.ZodOptional<z.ZodString>;
    twitter: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        alt: string;
    }, {
        url: string;
        alt: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    image?: {
        url: string;
        alt: string;
    } | undefined;
    author?: string | undefined;
    twitter?: string | undefined;
    title: string;
    description: string;
}, {
    title?: string | undefined;
    image?: {
        url: string;
        alt: string;
    } | undefined;
    description?: string | undefined;
    author?: string | undefined;
    twitter?: string | undefined;
}>;
