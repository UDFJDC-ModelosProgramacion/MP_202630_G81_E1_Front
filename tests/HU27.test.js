import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  validateNotification,
  filterNotifications,
  getNotifications,
  updateNotification,
  deleteNotification,
  getPets,
  getAdopters,
} from '../src/workflows/HU27.js';

const sampleNotifications = [
  {
    id: 1,
    tipo: 'Recordatorio',
    mensaje: 'Primera notificación',
    fecha: '2026-10-20',
    canal: 'EMAIL',
    mascota: { id: 10, nombre: 'Luna' },
    adoptante: { id: 100, nombre: 'Carlos' },
  },
  {
    id: 2,
    tipo: 'Aviso',
    mensaje: 'Segunda notificación',
    fecha: '2026-10-21',
    canal: 'SMS',
    mascota: { id: 20, nombre: 'Max' },
    adoptante: { id: 200, nombre: 'Laura' },
  },
  {
    id: 3,
    tipo: 'Alerta',
    mensaje: 'Tercera notificación',
    fecha: '2026-10-22',
    canal: 'EMAIL',
    mascota: { id: 10, nombre: 'Luna' },
    adoptante: { id: 200, nombre: 'Laura' },
  },
];

describe('HU27 - Gestionar notificaciones registradas', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateNotification', () => {
    it('acepta una notificación válida', () => {
      const errors = validateNotification({
        tipo: 'Recordatorio',
        mensaje: 'Mensaje de prueba',
        fecha: '2026-10-20',
        canal: 'EMAIL',
      });

      expect(errors).toEqual({});
    });

    it('rechaza un tipo vacío', () => {
      const errors = validateNotification({
        tipo: ' ',
        mensaje: 'Mensaje',
        fecha: '2026-10-20',
        canal: 'EMAIL',
      });

      expect(errors.tipo).toBeDefined();
    });

    it('rechaza un mensaje vacío', () => {
      const errors = validateNotification({
        tipo: 'Aviso',
        mensaje: ' ',
        fecha: '2026-10-20',
        canal: 'EMAIL',
      });

      expect(errors.mensaje).toBeDefined();
    });

    it('rechaza una fecha vacía', () => {
      const errors = validateNotification({
        tipo: 'Aviso',
        mensaje: 'Mensaje',
        fecha: '',
        canal: 'EMAIL',
      });

      expect(errors.fecha).toBeDefined();
    });

    it('rechaza un formato de fecha incorrecto', () => {
      const errors = validateNotification({
        tipo: 'Aviso',
        mensaje: 'Mensaje',
        fecha: '20/10/2026',
        canal: 'EMAIL',
      });

      expect(errors.fecha).toBeDefined();
    });

    it('rechaza un canal inválido', () => {
      const errors = validateNotification({
        tipo: 'Aviso',
        mensaje: 'Mensaje',
        fecha: '2026-10-20',
        canal: 'WHATSAPP',
      });

      expect(errors.canal).toBeDefined();
    });
  });

  describe('filterNotifications', () => {
    it('devuelve todas las notificaciones sin filtros', () => {
      expect(filterNotifications(sampleNotifications)).toHaveLength(3);
    });

    it('filtra por canal', () => {
      const result = filterNotifications(sampleNotifications, {
        canal: 'EMAIL',
      });

      expect(result).toHaveLength(2);
      expect(result.every((item) => item.canal === 'EMAIL')).toBe(true);
    });

    it('filtra por mascota', () => {
      const result = filterNotifications(sampleNotifications, {
        mascotaId: '10',
      });

      expect(result).toHaveLength(2);
    });

    it('filtra por adoptante', () => {
      const result = filterNotifications(sampleNotifications, {
        adoptanteId: '200',
      });

      expect(result).toHaveLength(2);
    });

    it('combina varios filtros', () => {
      const result = filterNotifications(sampleNotifications, {
        canal: 'EMAIL',
        mascotaId: '10',
        adoptanteId: '200',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    it('devuelve una lista vacía si no hay coincidencias', () => {
      const result = filterNotifications(sampleNotifications, {
        canal: 'PUSH',
      });

      expect(result).toEqual([]);
    });
  });

  describe('getNotifications', () => {
    it('consulta las notificaciones del backend', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(sampleNotifications),
      }));

      const result = await getNotifications();

      expect(result).toHaveLength(3);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/notificaciones',
        expect.any(Object),
      );
    });

    it('devuelve el contenido de una respuesta paginada', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          content: sampleNotifications,
        }),
      }));

      const result = await getNotifications();

      expect(result).toHaveLength(3);
    });
  });

  describe('updateNotification', () => {
    it('actualiza una notificación existente', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 1 }),
      }));

      const values = {
        tipo: 'Recordatorio actualizado',
        mensaje: 'Nuevo mensaje',
        fecha: '2026-10-25',
        canal: 'SMS',
      };

      await updateNotification(1, values, sampleNotifications[0]);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/notificaciones/1',
        expect.objectContaining({
          method: 'PUT',
          body: expect.any(String),
        }),
      );

      const body = JSON.parse(fetch.mock.calls[0][1].body);

      expect(body.tipo).toBe('Recordatorio actualizado');
      expect(body.mensaje).toBe('Nuevo mensaje');
      expect(body.canal).toBe('SMS');
    });

    it('rechaza la actualización cuando faltan datos', async () => {
      await expect(
        updateNotification(1, {
          tipo: '',
          mensaje: '',
          fecha: '',
          canal: '',
        }, sampleNotifications[0]),
      ).rejects.toThrow();

      expect(fetch).not.toHaveBeenCalled();
    });

    it('muestra error cuando el ID no existe', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '',
      }));

      await expect(
        updateNotification(999, {
          tipo: 'Aviso',
          mensaje: 'Mensaje',
          fecha: '2026-10-25',
          canal: 'EMAIL',
        }, {}),
      ).rejects.toThrow('La notificación solicitada no fue encontrada.');
    });
  });

  describe('deleteNotification', () => {
    it('elimina una notificación existente', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: async () => '',
      }));

      await deleteNotification(1);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/notificaciones/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('muestra error cuando se intenta eliminar un ID inexistente', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => '',
      }));

      await expect(deleteNotification(999))
        .rejects.toThrow('La notificación solicitada no fue encontrada.');
    });

    it('rechaza la eliminación si no se proporciona un ID', async () => {
      await expect(deleteNotification(''))
        .rejects.toThrow('El ID de la notificación es obligatorio.');

      expect(fetch).not.toHaveBeenCalled();
    });
  });
}); 

describe('HU27 - cobertura adicional', () => {
  const validValues = {
    tipo: 'Recordatorio',
    mensaje: 'Mensaje de prueba',
    fecha: '2026-10-20',
    canal: 'EMAIL',
  };

  function mockResponse(data, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => data === null ? '' : JSON.stringify(data),
      json: async () => data,
    };
  }

  it('valida campos faltantes y valores nulos', () => {
    const errors = validateNotification({
      tipo: null,
      mensaje: null,
      fecha: null,
      canal: null,
    });

    expect(errors.tipo).toBeDefined();
    expect(errors.mensaje).toBeDefined();
    expect(errors.fecha).toBeDefined();
    expect(errors.canal).toBeDefined();
  });

  it('filtra usando identificadores alternativos', () => {
    const notifications = [{
      canal: 'EMAIL',
      mascota: { mascotaId: 10 },
      adoptante: { adoptanteId: 20 },
    }];

    expect(filterNotifications(notifications, {
      canal: 'EMAIL',
      mascotaId: '10',
      adoptanteId: '20',
    })).toHaveLength(1);
  });

  it('descarta notificaciones sin relaciones coincidentes', () => {
    expect(filterNotifications([{
      canal: 'SMS',
      mascota: null,
      adoptante: null,
    }], {
      canal: 'EMAIL',
      mascotaId: '10',
      adoptanteId: '20',
    })).toEqual([]);
  });

  it('obtiene notificaciones desde data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ data: sampleNotifications })
    ));

    expect(await getNotifications()).toHaveLength(3);
  });

  it('devuelve lista vacía si no hay notificaciones', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({})
    ));

    expect(await getNotifications()).toEqual([]);
  });

  it('devuelve lista vacía si la respuesta es nula', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await getNotifications()).toEqual([]);
  });

  it('rechaza actualización sin ID', async () => {
    await expect(updateNotification('', validValues, {}))
      .rejects.toThrow('El ID de la notificación es obligatorio.');
  });

  it('obtiene mascotas como lista', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse([{ id: 1, nombre: 'Mora' }])
    ));

    expect(await getPets()).toHaveLength(1);
  });

  it('obtiene mascotas desde content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ content: [{ id: 1 }] })
    ));

    expect(await getPets()).toHaveLength(1);
  });

  it('obtiene mascotas desde data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ data: [{ id: 2 }] })
    ));

    expect(await getPets()).toHaveLength(1);
  });

  it('devuelve mascotas vacías si no hay datos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await getPets()).toEqual([]);
  });

  it('obtiene adoptantes como lista', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse([{ id: 1, nombre: 'Ana' }])
    ));

    expect(await getAdopters()).toHaveLength(1);
  });

  it('obtiene adoptantes desde content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ content: [{ id: 1 }] })
    ));

    expect(await getAdopters()).toHaveLength(1);
  });

  it('obtiene adoptantes desde data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ data: [{ id: 2 }] })
    ));

    expect(await getAdopters()).toHaveLength(1);
  });

  it('devuelve adoptantes vacíos si no hay datos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await getAdopters()).toEqual([]);
  });

  it('maneja respuesta HTTP 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }));

    expect(await deleteNotification(1)).toBeNull();
  });

  it('maneja respuesta HTTP 200 sin contenido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await deleteNotification(1)).toBeNull();
  });

  it('muestra el mensaje de error del backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ message: 'Error personalizado' }, 400)
    ));

    await expect(deleteNotification(1))
      .rejects.toThrow('Error personalizado');
  });

  it('usa error como mensaje alternativo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ error: 'Error interno' }, 500)
    ));

    await expect(deleteNotification(1))
      .rejects.toThrow('Error interno');
  });

  it('usa mensaje HTTP cuando no hay detalles', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({}, 500)
    ));

    await expect(deleteNotification(1))
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

    await expect(deleteNotification(1))
      .rejects.toThrow('Error HTTP 500');
  });

  it('envía encabezado JSON al actualizar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ id: 1 })
    ));

    await updateNotification(1, validValues, { id: 1 });

    expect(fetch.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
    });
  });
});
