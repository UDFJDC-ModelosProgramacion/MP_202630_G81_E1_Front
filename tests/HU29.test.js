import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  getPets,
  getMedicalEvents,
  getPetId,
  filterMedicalEvents,
  getMedicalEventById,
} from '../src/workflows/HU29.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => data === null ? '' : JSON.stringify(data),
  };
}

const events = [
  {
    id: 1,
    fecha: '2026-10-01',
    descripcion: 'Consulta general',
    diagnostico: 'Gripe',
    tratamiento: 'Medicamento',
    mascota: { id: 10 },
  },
  {
    id: 2,
    fecha: '2026-10-02',
    descripcion: 'Revisión',
    diagnostico: 'Infección',
    tratamiento: 'Antibiótico',
    mascota: { id: 10 },
  },
  {
    id: 3,
    fecha: '2026-10-03',
    descripcion: 'Vacunación',
    diagnostico: 'Sano',
    tratamiento: 'Vacuna',
    mascota: { id: 20 },
  },
];

describe('HU29 - Consulta de historial médico', () => {
  it('debe consultar las mascotas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse([{ id: 10, nombre: 'Mora' }]),
    ));

    const result = await getPets();

    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Mora');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8999/api/mascotas',
    );
  });

  it('debe consultar los eventos médicos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(events),
    ));

    const result = await getMedicalEvents();

    expect(result).toHaveLength(3);
    expect(result[0].diagnostico).toBe('Gripe');
  });

  it('debe obtener el ID de la mascota asociada al evento', () => {
    expect(getPetId(events[0])).toBe(10);
  });

  it('debe filtrar eventos por mascota', () => {
    const result = filterMedicalEvents(events, 10);

    expect(result).toHaveLength(2);
    expect(result.every((event) => event.mascota.id === 10)).toBe(true);
  });

  it('debe filtrar eventos por diagnóstico', () => {
    const result = filterMedicalEvents(events, 10, 'gripe');

    expect(result).toHaveLength(1);
    expect(result[0].diagnostico).toBe('Gripe');
  });

  it('debe ignorar mayúsculas y espacios al filtrar', () => {
    const result = filterMedicalEvents(events, 10, '  INFECCIÓN  ');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('debe devolver una lista vacía cuando no hay eventos', () => {
    const result = filterMedicalEvents([], 10);

    expect(result).toEqual([]);
  });

  it('debe consultar un evento médico por ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(events[0]),
    ));

    const result = await getMedicalEventById(1);

    expect(result.id).toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8999/api/eventos-medicos/1',
    );
  });

  it('debe informar cuando el evento no existe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ message: 'No encontrado' }, 404),
    ));

    await expect(getMedicalEventById(999)).rejects.toThrow(
      'El evento médico solicitado no fue encontrado.',
    );
  });

  it('no debe consultar cuando el ID está vacío', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMedicalEventById('')).rejects.toThrow(
      'Debe ingresar el ID del evento médico.',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no debe consultar cuando el ID no es válido', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMedicalEventById('abc')).rejects.toThrow(
      'El ID del evento médico no es válido.',
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});