import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  validateMedicalEvent,
  validateMedicalEventUpdate,
  createMedicalEvent,
  updateMedicalEvent,
  getMedicalEvents,
} from '../src/workflows/HU28.js';

const originalEvent = {
  id: 1,
  fecha: '2026-10-20',
  descripcion: 'Revisión general',
  diagnostico: 'Gripe',
  tratamiento: 'Medicamento',
  mascota: { id: 10, nombre: 'Luna' },
};

describe('HU28 - Registrar eventos médicos', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateMedicalEvent', () => {
    const validValues = {
      mascotaId: '10',
      fecha: '2026-10-20',
      descripcion: 'Revisión general',
      diagnostico: 'Gripe',
      tratamiento: 'Medicamento',
    };

    it('acepta un evento médico válido', () => {
      expect(validateMedicalEvent(validValues)).toEqual({});
    });

    it('rechaza una mascota no seleccionada', () => {
      const errors = validateMedicalEvent({
        ...validValues,
        mascotaId: '',
      });

      expect(errors.mascotaId).toBeDefined();
    });

    it('rechaza una fecha vacía', () => {
      const errors = validateMedicalEvent({
        ...validValues,
        fecha: '',
      });

      expect(errors.fecha).toBeDefined();
    });

    it('rechaza una descripción vacía', () => {
      const errors = validateMedicalEvent({
        ...validValues,
        descripcion: ' ',
      });

      expect(errors.descripcion).toBeDefined();
    });

    it('rechaza un diagnóstico vacío', () => {
      const errors = validateMedicalEvent({
        ...validValues,
        diagnostico: ' ',
      });

      expect(errors.diagnostico).toBeDefined();
    });

    it('rechaza un tratamiento vacío', () => {
      const errors = validateMedicalEvent({
        ...validValues,
        tratamiento: ' ',
      });

      expect(errors.tratamiento).toBeDefined();
    });
  });

  describe('validateMedicalEventUpdate', () => {
    it('acepta los datos válidos de edición', () => {
      expect(validateMedicalEventUpdate({
        descripcion: 'Nueva descripción',
        diagnostico: 'Nuevo diagnóstico',
        tratamiento: 'Nuevo tratamiento',
      })).toEqual({});
    });

    it('rechaza un diagnóstico vacío al editar', () => {
      const errors = validateMedicalEventUpdate({
        descripcion: 'Descripción',
        diagnostico: '',
        tratamiento: 'Tratamiento',
      });

      expect(errors.diagnostico).toBeDefined();
    });

    it('rechaza una descripción vacía al editar', () => {
      const errors = validateMedicalEventUpdate({
        descripcion: ' ',
        diagnostico: 'Diagnóstico',
        tratamiento: 'Tratamiento',
      });

      expect(errors.descripcion).toBeDefined();
    });

    it('rechaza un tratamiento vacío al editar', () => {
      const errors = validateMedicalEventUpdate({
        descripcion: 'Descripción',
        diagnostico: 'Diagnóstico',
        tratamiento: ' ',
      });

      expect(errors.tratamiento).toBeDefined();
    });
  });

  describe('createMedicalEvent', () => {
    it('registra un evento médico correctamente', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ id: 1 }),
      }));

      const values = {
        mascotaId: '10',
        fecha: '2026-10-20',
        descripcion: 'Revisión general',
        diagnostico: 'Gripe',
        tratamiento: 'Medicamento',
      };

      await createMedicalEvent(values);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8999/api/eventos-medicos',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        }),
      );

      const body = JSON.parse(fetch.mock.calls[0][1].body);

      expect(body.descripcion).toBe('Revisión general');
      expect(body.diagnostico).toBe('Gripe');
      expect(body.tratamiento).toBe('Medicamento');
      expect(body.mascota.id).toBe(10);
    });

    it('no envía el registro si el diagnóstico está vacío', async () => {
      await expect(createMedicalEvent({
        mascotaId: '10',
        fecha: '2026-10-20',
        descripcion: 'Revisión',
        diagnostico: '',
        tratamiento: 'Medicamento',
      })).rejects.toThrow('El diagnóstico es obligatorio.');

      expect(fetch).not.toHaveBeenCalled();
    });

    it('muestra error si la mascota no existe', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          message: 'La mascota no existe',
        }),
      }));

      await expect(createMedicalEvent({
        mascotaId: '999',
        fecha: '2026-10-20',
        descripcion: 'Revisión',
        diagnostico: 'Gripe',
        tratamiento: 'Medicamento',
      })).rejects.toThrow(
        'El evento médico o la mascota no fueron encontrados.',
      );
    });
  });

  describe('getMedicalEvents', () => {
    it('consulta los eventos médicos', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([originalEvent]),
      }));

      const result = await getMedicalEvents();

      expect(result).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8999/api/eventos-medicos',
        expect.any(Object),
      );
    });
  });

  describe('updateMedicalEvent', () => {
    it('actualiza descripción, diagnóstico y tratamiento', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 1 }),
      }));

      await updateMedicalEvent(1, {
        descripcion: 'Descripción actualizada',
        diagnostico: 'Diagnóstico actualizado',
        tratamiento: 'Tratamiento actualizado',
      }, originalEvent);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8999/api/eventos-medicos/1',
        expect.objectContaining({
          method: 'PUT',
        }),
      );

      const body = JSON.parse(fetch.mock.calls[0][1].body);

      expect(body.descripcion).toBe('Descripción actualizada');
      expect(body.diagnostico).toBe('Diagnóstico actualizado');
      expect(body.tratamiento).toBe('Tratamiento actualizado');
      expect(body.mascota.id).toBe(10);
      expect(body.fecha).toBe(originalEvent.fecha);
    });

    it('rechaza editar si el diagnóstico está vacío', async () => {
      await expect(updateMedicalEvent(1, {
        descripcion: 'Descripción',
        diagnostico: '',
        tratamiento: 'Tratamiento',
      }, originalEvent)).rejects.toThrow(
        'El diagnóstico es obligatorio.',
      );

      expect(fetch).not.toHaveBeenCalled();
    });

    it('muestra error cuando el evento no existe', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      }));

      await expect(updateMedicalEvent(999, {
        descripcion: 'Descripción',
        diagnostico: 'Diagnóstico',
        tratamiento: 'Tratamiento',
      }, originalEvent)).rejects.toThrow(
        'El evento médico o la mascota no fueron encontrados.',
      );
    });

    it('rechaza una actualización sin ID', async () => {
      await expect(updateMedicalEvent('', {
        descripcion: 'Descripción',
        diagnostico: 'Diagnóstico',
        tratamiento: 'Tratamiento',
      }, originalEvent)).rejects.toThrow(
        'El ID del evento médico es obligatorio.',
      );

      expect(fetch).not.toHaveBeenCalled();
    });
  });
});