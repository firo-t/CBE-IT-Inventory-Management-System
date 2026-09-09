import {z} from "zod";
export const requiredText = z.string().min(1, "This field is required");
export const phoneSchema = z.string().regex(/^[0-9+ -]{7,20}$/, "Enter a valid phone number");
