
# AssisTech - Technical Assistance Management System

## Project Overview

AssisTech is a full-stack web application designed to manage technical assistance requests for multiple buildings/condominiums. The system allows a single administrator to create and assign service requests to pre-registered suppliers. Suppliers interact with the system exclusively through unique secure links sent via email, where they can schedule visits, complete tasks with photo evidence, or reject/reschedule assignments.

## Architecture

### Frontend (Existing)
- React
- TypeScript
- Tailwind CSS
- Vite
- shadcn/ui components

### Backend (To Be Implemented with Supabase)
- Database: PostgreSQL (Supabase)
- API: Supabase PostgREST API
- Storage: Supabase Storage (for supplier photos)
- Serverless Functions: Supabase Edge Functions (Deno/TypeScript)
- Scheduled Tasks: Supabase Scheduled Functions
- Email Service: Resend (via Edge Functions)

### Authentication
- Admin access protected by API Key (X-API-KEY header)
- Supplier access via unique secure tokens in email links

## Database Schema

The database will consist of the following main tables:
- buildings (condominiums/properties)
- suppliers (service providers)
- intervention_types (categories of service)
- assistances (main service requests)
- email_logs (tracking of all email communications)
- activity_log (detailed system activity tracking)

Detailed SQL schema includes:
```sql
-- Buildings table
CREATE TABLE buildings (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    cadastral_code TEXT UNIQUE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Suppliers table
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    specialization TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Intervention types table
CREATE TABLE intervention_types (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    maps_to_urgency TEXT CHECK (maps_to_urgency IN ('Normal', 'Urgente', 'Orçamento', 'Garantia'))
);

-- Main assistances table
CREATE TABLE assistances (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES buildings(id),
    intervention_type_id BIGINT REFERENCES intervention_types(id),
    type TEXT NOT NULL CHECK (type IN ('Normal', 'Urgente', 'Orçamento', 'Garantia')),
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente Resposta Inicial' CHECK (status IN (
        'Pendente Resposta Inicial',
        'Agendada',
        'Rejeitada Pelo Fornecedor',
        'Concluída',
        'Cancelada Pelo Admin'
    )),
    alert_level INT DEFAULT 0 NOT NULL,
    photo_path TEXT,
    scheduled_datetime TIMESTAMPTZ,
    interaction_token TEXT UNIQUE NOT NULL,
    rejection_reason TEXT,
    admin_notes TEXT,
    opened_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Email logs table
CREATE TABLE email_logs (
    id BIGSERIAL PRIMARY KEY,
    assistance_id BIGINT REFERENCES assistances(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    template_name TEXT,
    recipients TEXT,
    success BOOLEAN
);

-- Activity log table
CREATE TABLE activity_log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    assistance_id BIGINT REFERENCES assistances(id) ON DELETE CASCADE,
    actor TEXT NOT NULL CHECK (actor IN ('system', 'admin', 'supplier')),
    description TEXT NOT NULL
);
```

Additional schema elements include:
- Trigger for updating timestamps
- Row Level Security policies for secure supplier access

## Core Features

### Admin Dashboard
- Authentication via API Key
- CRUD operations for buildings, suppliers, and intervention types
- Creating, viewing, and managing assistance requests
- Reassigning rejected requests to new suppliers
- Receiving notifications for rejected requests and follow-ups
- Viewing reports and statistics
- Future AI suggestions (placeholder for now)

### Supplier Interaction
- Accessing requests via unique links
- Scheduling/rejecting initial requests
- Submitting completion photos
- Rescheduling appointments

### Automated System Functions
- Email notifications for various events
- Daily follow-up checks for missed appointments
- Alert escalation for aging requests
- Comprehensive logging of all activities

## Implementation Plan

### 1. Backend Setup
- Create Supabase project and database schema
- Implement Row Level Security policies
- Set up Storage buckets for photos

### 2. Edge Functions Implementation
- admin-handler
  - CRUD for buildings, suppliers, intervention_types
  - Create, list, filter, detail, reassign, and cancel assistances
  - Report data generation
- send-email
  - Integration with Resend
  - Email templates for different notifications
  - Log email sending results
- handle-supplier-interaction
  - Token validation
  - Status-based actions (schedule, reject, complete, reschedule)
  - Photo upload handling
- Scheduled Functions
  - daily-followup-check
  - alert-escalation
  - (optional) weekly-reminder

### 3. Frontend Integration
- Configure Supabase client
- Implement API Key authentication for admin actions
- Create supplier interaction page
- Update existing UI components to connect with the backend

### 4. Testing
- End-to-end testing of all workflows
- Security testing of token-based access
- Email delivery verification

### 5. Deployment
- Set up production environment
- Configure environment variables
- Deploy to production

## Environment Variables

The system will require several environment variables:
- SUPABASE_URL and SUPABASE_ANON_KEY (for frontend)
- SUPABASE_SERVICE_ROLE_KEY (for privileged backend operations)
- RESEND_API_KEY
- ADMIN_API_KEY
- APP_BASE_URL
- ADMIN_INTERNAL_EMAIL

## Project Structure

```
/assis-tech-frontend/     # Existing React/Vite codebase
/assis-tech-supabase/
  /migrations/          # .sql files for database schema changes
  /functions/
    /admin-handler/     # Admin actions endpoint
    /send-email/        # Email sending logic
    /handle-supplier-interaction/ # Supplier actions endpoint
    /generate-pdf-report/ # PDF generation logic
    /daily-followup-check/ # Scheduled function logic
    /alert-escalation/     # Scheduled function logic
    /_shared/             # Common code (types, clients, utils)
    /import_map.json      # Deno import map
  /seed.sql               # (Optional) Initial data seeding
  /config.toml            # Local Supabase CLI configuration
```

## Future Extensions

- Enhanced reporting and analytics
- AI-powered suggestions based on historical data
- Mobile app for suppliers
