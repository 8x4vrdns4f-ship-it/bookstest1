import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  position: z.string().max(100).optional().or(z.literal("")),
});

export const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  can_approve_requests: z.boolean(),
  can_view_all_bookings: z.boolean(),
  can_check_in: z.boolean(),
  can_manage_settings: z.boolean(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const joinCompanySchema = z.object({
  code: z.string().min(1, "Company code is required").max(50),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type EmployeeForm = z.infer<typeof employeeSchema>;
export type RoleForm = z.infer<typeof roleSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type JoinCompanyForm = z.infer<typeof joinCompanySchema>;
