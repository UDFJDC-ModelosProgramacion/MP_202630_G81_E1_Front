import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  validateMedicalEvent,
  validateMedicalEventUpdate,
  createMedicalEvent,
  updateMedicalEvent,
  getMedicalEvents,
  getPets,
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

describe('HU28 - cobertura adicional', () => {
  const validValues = {
    mascotaId: '10',
    fecha: '2026-10-20',
    descripcion: 'Revisión general',
    diagnostico: 'Gripe',
    tratamiento: 'Medicamento',
  };

  function mockResponse(data, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => data === null ? '' : JSON.stringify(data),
      json: async () => data,
    };
  }

  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('rechaza valores nulos y fechas con formato incorrecto', () => {
    const errors = validateMedicalEvent({
      mascotaId: null,
      fecha: '20/10/2026',
      descripcion: null,
      diagnostico: null,
      tratamiento: null,
    });

    expect(errors.mascotaId).toBeDefined();
    expect(errors.fecha).toBe('La fecha no tiene un formato válido.');
    expect(errors.descripcion).toBeDefined();
    expect(errors.diagnostico).toBeDefined();
    expect(errors.tratamiento).toBeDefined();
  });

  it('rechaza campos nulos al editar', () => {
    const errors = validateMedicalEventUpdate({
      descripcion: null,
      diagnostico: null,
      tratamiento: null,
    });

    expect(errors.descripcion).toBeDefined();
    expect(errors.diagnostico).toBeDefined();
    expect(errors.tratamiento).toBeDefined();
  });

  it('obtiene eventos desde content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ content: [originalEvent] })
    ));

    expect(await getMedicalEvents()).toHaveLength(1);
  });

  it('obtiene eventos desde data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ data: [originalEvent] })
    ));

    expect(await getMedicalEvents()).toHaveLength(1);
  });

  it('devuelve una lista vacía cuando no hay eventos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({})
    ));

    expect(await getMedicalEvents()).toEqual([]);
  });

  it('devuelve una lista vacía cuando la respuesta es nula', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await getMedicalEvents()).toEqual([]);
  });

  it('consulta mascotas como lista', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse([{ id: 10, nombre: 'Luna' }])
    ));

    expect(await getPets()).toHaveLength(1);
  });

  it('consulta mascotas desde content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ content: [{ id: 10 }] })
    ));

    expect(await getPets()).toHaveLength(1);
  });

  it('consulta mascotas desde data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ data: [{ id: 10 }] })
    ));

    expect(await getPets()).toHaveLength(1);
  });

  it('devuelve mascotas vacías si no hay datos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await getPets()).toEqual([]);
  });

  it('maneja una respuesta HTTP 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }));

    expect(await createMedicalEvent(validValues)).toBeNull();
  });

  it('maneja una respuesta HTTP 200 sin contenido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await createMedicalEvent(validValues)).toBeNull();
  });

  it('muestra el mensaje de error del backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ message: 'Error personalizado' }, 400)
    ));

    await expect(createMedicalEvent(validValues))
      .rejects.toThrow('Error personalizado');
  });

  it('usa error como mensaje alternativo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ error: 'Error interno' }, 500)
    ));

    await expect(createMedicalEvent(validValues))
      .rejects.toThrow('Error interno');
  });

  it('usa mensaje HTTP cuando el backend no da detalles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({}, 500)
    ));

    await expect(createMedicalEvent(validValues))
      .rejects.toThrow('Error HTTP 500');
  });

  it('maneja respuestas de error sin JSON válido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError('JSON inválido');
      },
    }));

    await expect(createMedicalEvent(validValues))
      .rejects.toThrow('Error HTTP 500');
  });

  it('conserva los encabezados JSON al registrar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ id: 1 })
    ));

    await createMedicalEvent(validValues);

    expect(fetch.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
    });
  });
});
