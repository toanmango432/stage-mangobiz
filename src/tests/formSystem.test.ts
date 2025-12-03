/**
 * Form System Backend Tests
 * Tests formTemplatesDB and formResponsesDB CRUD operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { formTemplatesDB, formResponsesDB } from '../db/database';
import { db } from '../db/schema';
import { PRE_BUILT_TEMPLATES } from '../constants/formTemplates';
import type { FormTemplate, ClientFormResponse } from '../types/client';

describe('Form System Backend Tests', () => {
  const testStoreId = 'test-store-123';
  const testClientId = 'test-client-456';
  let createdTemplateId: string;
  let createdResponseId: string;

  beforeAll(async () => {
    // Open database
    await db.open();
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdTemplateId) {
      await formTemplatesDB.delete(createdTemplateId);
    }
    if (createdResponseId) {
      await db.formResponses.delete(createdResponseId);
    }
  });

  describe('formTemplatesDB', () => {
    it('should create a form template', async () => {
      const templateData: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
        storeId: testStoreId,
        name: 'Test Form Template',
        description: 'A test template for unit testing',
        sendMode: 'manual',
        requiresSignature: true,
        sections: [
          {
            id: 'section-1',
            type: 'text_input',
            label: 'Your Name',
            required: true,
            order: 0,
            config: {},
          },
          {
            id: 'section-2',
            type: 'consent_checkbox',
            label: 'I agree to the terms',
            required: true,
            order: 1,
            config: {},
          },
        ],
        isActive: true,
      };

      const created = await formTemplatesDB.create(templateData);
      createdTemplateId = created.id;

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Test Form Template');
      expect(created.storeId).toBe(testStoreId);
      expect(created.sections.length).toBe(2);
      expect(created.syncStatus).toBe('local');
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
    });

    it('should get a template by ID', async () => {
      const template = await formTemplatesDB.getById(createdTemplateId);

      expect(template).toBeDefined();
      expect(template?.id).toBe(createdTemplateId);
      expect(template?.name).toBe('Test Form Template');
    });

    it('should get all templates for a store', async () => {
      // Use activeOnly=false to get all templates including inactive ones
      const templates = await formTemplatesDB.getAll(testStoreId, false);

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.some(t => t.id === createdTemplateId)).toBe(true);
    });

    it('should get active templates for a store', async () => {
      const templates = await formTemplatesDB.getActiveByStore(testStoreId);

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.every(t => t.isActive === true)).toBe(true);
    });

    it('should update a template', async () => {
      const updated = await formTemplatesDB.update(createdTemplateId, {
        name: 'Updated Test Template',
        description: 'Updated description',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Test Template');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.syncStatus).toBe('local');
    });

    it('should get templates by service ID', async () => {
      // First update template to link to a service
      await formTemplatesDB.update(createdTemplateId, {
        linkedServiceIds: ['service-abc', 'service-xyz'],
      });

      const templates = await formTemplatesDB.getByServiceId(testStoreId, 'service-abc');

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should delete a template', async () => {
      const result = await formTemplatesDB.delete(createdTemplateId);
      expect(result).toBe(true);

      const deleted = await formTemplatesDB.getById(createdTemplateId);
      expect(deleted).toBeUndefined();

      // Clear the ID since it's deleted
      createdTemplateId = '';
    });
  });

  describe('formResponsesDB', () => {
    beforeAll(async () => {
      // Create a template first for responses
      const template = await formTemplatesDB.create({
        storeId: testStoreId,
        name: 'Response Test Template',
        sendMode: 'manual',
        requiresSignature: false,
        sections: [],
        isActive: true,
      });
      createdTemplateId = template.id;
    });

    it('should create a form response', async () => {
      const responseData: Omit<ClientFormResponse, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
        formTemplateId: createdTemplateId,
        templateName: 'Response Test Template',
        clientId: testClientId,
        appointmentId: 'appointment-789',
        responses: {},
        status: 'pending',
        sentAt: new Date().toISOString(),
        completedBy: 'client',
      };

      const created = await formResponsesDB.create(responseData);
      createdResponseId = created.id;

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.clientId).toBe(testClientId);
      expect(created.status).toBe('pending');
      expect(created.syncStatus).toBe('local');
    });

    it('should get responses by client ID', async () => {
      const responses = await formResponsesDB.getByClientId(testClientId);

      expect(responses).toBeDefined();
      expect(Array.isArray(responses)).toBe(true);
      expect(responses.some(r => r.id === createdResponseId)).toBe(true);
    });

    it('should get a response by ID', async () => {
      const response = await formResponsesDB.getById(createdResponseId);

      expect(response).toBeDefined();
      expect(response?.id).toBe(createdResponseId);
      expect(response?.clientId).toBe(testClientId);
    });

    it('should get pending responses for a client', async () => {
      const pending = await formResponsesDB.getPending(testClientId);

      expect(pending).toBeDefined();
      expect(Array.isArray(pending)).toBe(true);
      expect(pending.every(r => r.status === 'pending')).toBe(true);
    });

    it('should get responses by appointment ID', async () => {
      const responses = await formResponsesDB.getByAppointmentId('appointment-789');

      expect(responses).toBeDefined();
      expect(Array.isArray(responses)).toBe(true);
      expect(responses.some(r => r.id === createdResponseId)).toBe(true);
    });

    it('should update a response', async () => {
      const updated = await formResponsesDB.update(createdResponseId, {
        responses: { field1: 'value1', field2: 'value2' },
      });

      expect(updated).toBeDefined();
      expect(updated?.responses).toEqual({ field1: 'value1', field2: 'value2' });
      expect(updated?.syncStatus).toBe('local');
    });

    it('should complete a form response', async () => {
      const completed = await formResponsesDB.complete(
        createdResponseId,
        { field1: 'final-value', consent: true },
        'client',
        'data:image/png;base64,signature-data'
      );

      expect(completed).toBeDefined();
      expect(completed?.status).toBe('completed');
      expect(completed?.completedAt).toBeDefined();
      expect(completed?.completedBy).toBe('client');
      expect(completed?.signatureImage).toBe('data:image/png;base64,signature-data');
      expect(completed?.responses).toEqual({ field1: 'final-value', consent: true });
    });
  });

  describe('Pre-built Templates', () => {
    it('should have valid pre-built templates', () => {
      expect(PRE_BUILT_TEMPLATES).toBeDefined();
      expect(Array.isArray(PRE_BUILT_TEMPLATES)).toBe(true);
      expect(PRE_BUILT_TEMPLATES.length).toBe(5);
    });

    it('should have required fields in each template', () => {
      PRE_BUILT_TEMPLATES.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.template.sections).toBeDefined();
        expect(Array.isArray(item.template.sections)).toBe(true);
        expect(item.template.sections.length).toBeGreaterThan(0);
      });
    });

    it('should have COVID-19 Health Screening template', () => {
      const covid = PRE_BUILT_TEMPLATES.find(t => t.id === 'tpl_covid_screening');
      expect(covid).toBeDefined();
      expect(covid?.name).toBe('COVID-19 Health Screening');
      expect(covid?.template.requiresSignature).toBe(true);
    });

    it('should have Hair Color Consultation template', () => {
      const hairColor = PRE_BUILT_TEMPLATES.find(t => t.id === 'tpl_hair_color');
      expect(hairColor).toBeDefined();
      expect(hairColor?.name).toBe('Hair Color Consultation');
    });

    it('should have valid section types in templates', () => {
      const validTypes = [
        'client_details', 'text_input', 'single_choice', 'multi_choice',
        'date_picker', 'number_input', 'file_upload', 'consent_checkbox',
        'signature', 'info_text'
      ];

      PRE_BUILT_TEMPLATES.forEach(item => {
        item.template.sections.forEach(section => {
          expect(validTypes).toContain(section.type);
          expect(section.id).toBeDefined();
          expect(section.label).toBeDefined();
          expect(typeof section.required).toBe('boolean');
          expect(typeof section.order).toBe('number');
        });
      });
    });
  });
});
