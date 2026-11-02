import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  validateNotification,
  filterNotifications,
  getNotifications,
  updateNotification,
  deleteNotification,
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
        'http://localhost:8999/api/notificaciones',
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
        'http://localhost:8999/api/notificaciones/1',
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
        'http://localhost:8999/api/notificaciones/1',
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