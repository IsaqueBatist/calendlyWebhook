// ─────────────────────────────────────────────────────────────────────────────
// Calendly Webhook Types — based on the Calendly v2 API
// Event: invitee.created | invitee.canceled
// ─────────────────────────────────────────────────────────────────────────────

export type CalendlyEventType = "invitee.created" | "invitee.canceled";

// Tracking UTM and attribution data
export interface CalendlyTracking {
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
  salesforce_uuid: string | null;
}

// Answer to a custom question on the booking page
export interface CalendlyQuestionAndAnswer {
  answer: string;
  position: number;
  question: string;
}

// The scheduled event (meeting) the invitee booked
export interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  meeting_notes_plain: string | null;
  meeting_notes_html: string | null;
  status: "active" | "canceled";
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  event_type: string; // URI reference
  location: {
    type: string;
    location?: string;
    join_url?: string;
    status?: string;
  } | null;
  invitees_counter: {
    total: number;
    active: number;
    limit: number;
  };
  created_at: string;
  updated_at: string;
  event_memberships: Array<{
    user: string;
    user_email: string;
    user_name: string;
  }>;
  event_guests: Array<{
    email: string;
    created_at: string;
    updated_at: string;
  }>;
}

// The invitee (person who booked)
export interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: "active" | "canceled";
  questions_and_answers: CalendlyQuestionAndAnswer[];
  timezone: string;
  created_at: string;
  updated_at: string;
  tracking: CalendlyTracking;
  text_reminder_number: string | null;
  rescheduled: boolean;
  old_invitee: string | null; // URI of the previous invitee (if rescheduled)
  new_invitee: string | null; // URI of the new invitee (if rescheduled)
  cancel_url: string;
  reschedule_url: string;
  payment: {
    external_id: string;
    provider: string;
    amount: number;
    currency: string;
    terms: string;
    successful: boolean;
  } | null;
  no_show: {
    uri: string;
    created_at: string;
  } | null;
  reconfirmation: {
    created_at: string;
    confirmed_at: string | null;
  } | null;
  scheduled_event: CalendlyScheduledEvent;
  routing_form_submission: string | null;
}

// Root webhook payload shape
export interface CalendlyWebhookPayload {
  event: CalendlyEventType;
  created_at: string; // ISO 8601
  created_by: string; // URI of the user who triggered the webhook
  payload: CalendlyInvitee;
}
