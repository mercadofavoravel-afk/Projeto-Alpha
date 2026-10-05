import { describe, expect, it } from 'vitest';

import { parseGoogleLeadForm } from './google-lead-form';

describe('parseGoogleLeadForm', () => {
  it('reads stable Google field IDs and campaign provenance, ignoring unknown fields', () => {
    expect(
      parseGoogleLeadForm({
        lead_id: 'lead-123',
        google_key: 'secret',
        form_id: 7,
        campaign_id: 42,
        user_column_data: [
          { column_id: 'FULL_NAME', string_value: 'Maria Silva' },
          { column_id: 'PHONE_NUMBER', string_value: '+5521999999999' },
          { column_id: 'EMAIL', string_value: 'maria@example.com' },
          { column_id: 'FUTURE_FIELD', string_value: 'ignored' },
        ],
      }),
    ).toMatchObject({ externalId: 'lead-123', name: 'Maria Silva', formId: '7', campaignId: '42' });
  });

  it('rejects leads without a contact name or phone', () => {
    expect(
      parseGoogleLeadForm({
        lead_id: 'lead-123',
        google_key: 'secret',
        user_column_data: [],
      }),
    ).toBeNull();
  });
});
