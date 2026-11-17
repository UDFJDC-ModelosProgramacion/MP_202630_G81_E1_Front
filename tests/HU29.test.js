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
      'http://localhost:8080/api/mascotas',
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
      'http://localhost:8080/api/eventos-medicos/1',
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

describe('HU29 - cobertura adicional', () => {
  it('obtiene mascotas desde content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ content: [{ id: 10, nombre: 'Mora' }] })
    ));

    expect(await getPets()).toHaveLength(1);
  });

  it('obtiene mascotas desde data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ data: [{ id: 20, nombre: 'Luna' }] })
    ));

    expect(await getPets()).toHaveLength(1);
  });

  it('devuelve mascotas vacías si la respuesta no contiene datos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({})
    ));

    expect(await getPets()).toEqual([]);
  });

  it('devuelve mascotas vacías si la respuesta es nula', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await getPets()).toEqual([]);
  });

  it('obtiene eventos médicos desde content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ content: events })
    ));

    expect(await getMedicalEvents()).toHaveLength(3);
  });

  it('obtiene eventos médicos desde data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({ data: events })
    ));

    expect(await getMedicalEvents()).toHaveLength(3);
  });

  it('devuelve eventos vacíos cuando no hay datos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({})
    ));

    expect(await getMedicalEvents()).toEqual([]);
  });

  it('devuelve eventos vacíos cuando la respuesta es nula', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await getMedicalEvents()).toEqual([]);
  });

  it('obtiene ID usando mascotaId cuando no existe mascota.id', () => {
    expect(getPetId({ mascotaId: 25 })).toBe(25);
  });

  it('devuelve cadena vacía si el evento no tiene mascota', () => {
    expect(getPetId({})).toBe('');
    expect(getPetId(null)).toBe('');
  });

  it('obtiene ID alternativo cuando mascota.id es nulo', () => {
    expect(getPetId({
      mascota: { id: null },
      mascotaId: 30,
    })).toBe(30);
  });

  it('filtra eventos sin diagnóstico', () => {
    const medicalEvents = [
      { id: 1, mascota: { id: 10 }, diagnostico: null },
      { id: 2, mascota: { id: 20 }, diagnostico: 'Gripe' },
    ];

    expect(filterMedicalEvents(medicalEvents, 10)).toHaveLength(1);
    expect(filterMedicalEvents(medicalEvents, 10, 'gripe')).toEqual([]);
  });

  it('filtra eventos usando mascotaId alternativo', () => {
    const medicalEvents = [
      { id: 1, mascotaId: 10, diagnostico: 'Gripe' },
      { id: 2, mascotaId: 20, diagnostico: 'Gripe' },
    ];

    expect(filterMedicalEvents(medicalEvents, 10, 'gripe'))
      .toHaveLength(1);
  });

  it('maneja errores HTTP diferentes de 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse({}, 500)
    ));

    await expect(getMedicalEvents())
      .rejects.toThrow('Error al consultar la información. Código: 500');
  });

  it('maneja respuestas HTTP 200 sin contenido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      mockResponse(null)
    ));

    expect(await getMedicalEventById(1)).toBeNull();
  });

  it('rechaza identificadores negativos y decimales', async () => {
    await expect(getMedicalEventById(-1))
      .rejects.toThrow('El ID del evento médico no es válido.');

    await expect(getMedicalEventById('1.5'))
      .rejects.toThrow('El ID del evento médico no es válido.');
  });

  it('rechaza un ID nulo', async () => {
    await expect(getMedicalEventById(null))
      .rejects.toThrow('Debe ingresar el ID del evento médico.');
  });
});
