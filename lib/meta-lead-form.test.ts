import { describe, expect, it } from 'vitest';

import { parseMetaLeadDetail, parseMetaNotifications } from './meta-lead-form';

describe('Meta Lead Ads payloads', () => {
  it('extracts lead identifiers only from leadgen changes', () => {
    expect(
      parseMetaNotifications({
        object: 'page',
        entry: [
          {
            id: '123',
            changes: [
              { field: 'leadgen', value: { leadgen_id: '456', form_id: '789' } },
              { field: 'feed', value: {} },
            ],
          },
        ],
      }),
    ).toEqual([{ externalId: '456', pageId: '123', formId: '789', isTest: false }]);
  });

  it('requires matching lead identifier, name and phone from Graph API', () => {
    const detail = {
      id: '456',
      field_data: [
        { name: 'full_name', values: ['Cliente Meta'] },
        { name: 'phone_number', values: ['21999998888'] },
        { name: 'email', values: ['cliente@example.com'] },
      ],
    };
    expect(parseMetaLeadDetail(detail, '456')).toMatchObject({
      name: 'Cliente Meta',
      phone: '21999998888',
      email: 'cliente@example.com',
      neighborhood: null,
    });
    expect(parseMetaLeadDetail(detail, 'outro')).toBeNull();
    expect(parseMetaLeadDetail({ id: '456', field_data: [] }, '456')).toBeNull();
  });
});
