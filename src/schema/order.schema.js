  import { z } from "zod";

export const userAddressSchema = z.object({
  name: z.string().min(1, "Name is required").max(30),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  street: z.string().min(1, "Street is required").max(30),
  city:z.string().min(5, "city is required").max(30),
  state: z.string().min(5,"state is required").max(30),
  country: z.string().min(5, "country is required").max(30),
});