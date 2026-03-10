import { z } from "zod";

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const petSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  species: z.enum(["dog", "cat", "bird", "other"]),
  breed: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  weightKg: z.number().min(0).max(500).optional(),
  birthDate: z.string().optional(), // ISO date string
  gender: z.enum(["male", "female", "unknown"]).optional(),
  microchipId: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  medicalNotes: z.string().max(2000).optional(),
  isPublic: z.boolean().default(true),
});

export const lostPetSchema = z.object({
  isLost: z.boolean(),
  lastSeenLocation: z.string().max(500).optional(),
  lastSeenLat: z.number().min(-90).max(90).optional(),
  lastSeenLng: z.number().min(-180).max(180).optional(),
});

export const qrStyleSchema = z.object({
  dotStyle: z
    .enum(["square", "rounded", "dots", "classy", "extra-rounded"])
    .default("square"),
  colorForeground: z.string().default("#000000"),
  colorBackground: z.string().default("#ffffff"),
  gradientType: z.enum(["none", "linear", "radial"]).default("none"),
  gradientColors: z.array(z.string()).max(4).optional(),
  cornerStyle: z.enum(["square", "rounded", "dot"]).default("square"),
  logo: z.boolean().default(false),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type PetInput = z.infer<typeof petSchema>;
export type LostPetInput = z.infer<typeof lostPetSchema>;
export type QRStyleInput = z.infer<typeof qrStyleSchema>;
