import { z } from 'zod';

export const EventBasicInfoSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Event title is required" })
    .max(200, { message: "Event title is too long (max 200 characters)" }),
  
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(2000, { message: "Description is too long (max 2000 characters)" }),
  
  venue: z
    .string()
    .min(1, { message: "Venue is required" })
    .max(200, { message: "Venue name is too long (max 200 characters)" }),
  
    locationCoordinates: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
      message: "Coordinates must be in format 'latitude,longitude'"
    }),
  
  startedAt: z
    .string()
    .min(1, { message: "Start date is required" }),
  
  endedAt: z
    .string()
    .min(1, { message: "End date is required" }),
  
  publishedAt: z
    .string()
    .optional(),
  
  ticketsAvailableFrom: z
    .string()
    .optional(),
  
    attendeeVisibility: z
    .enum(['EVERYONE', 'ATTENDEES_ONLY', 'NOBODY'], {
      message: "Please select a valid visibility option"
    }),
  
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'SALES_STARTED', 'ONGOING', 'FINISHED'], {
      message: "Please select a valid status"
    }),
  
  companyId: z
    .number()
    .positive({ message: "Please select a company" }),
  
  formatId: z
    .number()
    .positive({ message: "Please select a format" }),
});

export const EventThemesSchema = z.object({
  themes: z.array(
    z.number().positive()
  ).min(1, { message: "Please select at least one theme" }),
});

const TicketSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Ticket title is required" })
    .max(100, { message: "Ticket title is too long (max 100 characters)" }),
  
  price: z
    .number()
    .nonnegative({ message: "Price must be zero or positive" }),
  
  status: z
    .enum(['AVAILABLE', 'SOLD', 'RESERVED'], {
      message: "Please select a valid ticket status"
    }),
  
  quantity: z
    .number()
    .positive({ message: "Quantity must be at least 1" }),
});

export const EventTicketsSchema = z.object({
  tickets: z.array(TicketSchema)
    .min(1, { message: "Please add at least one ticket type" }),
});

export type EventBasicInfo = z.infer<typeof EventBasicInfoSchema>;
export type EventThemes = z.infer<typeof EventThemesSchema>;
export type EventTicket = z.infer<typeof TicketSchema>;
export type EventTickets = z.infer<typeof EventTicketsSchema>;

export interface EventFormData {
  basicInfo: EventBasicInfo;
  themes: EventThemes;
  tickets: EventTickets;
  promoCodes: {
    promoCodes: {
      title: string;
      code: string;
      discountPercent: number;
      isActive: boolean;
    }[];
  };
}

