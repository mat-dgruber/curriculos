import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    pipe = new RelativeTimePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should return "agora mesmo" for very recent date', () => {
    const now = new Date().toISOString();
    expect(pipe.transform(now)).toBe('agora mesmo');
  });

  it('should return minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(pipe.transform(fiveMinAgo)).toBe('5 minutos atrás');
  });

  it('should use singular for 1 minute', () => {
    const oneMinAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
    expect(pipe.transform(oneMinAgo)).toBe('1 minuto atrás');
  });

  it('should return hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(threeHoursAgo)).toBe('3 horas atrás');
  });

  it('should use singular for 1 hour', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(oneHourAgo)).toBe('1 hora atrás');
  });

  it('should return days ago', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(fiveDaysAgo)).toBe('5 dias atrás');
  });

  it('should use singular for 1 day', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(oneDayAgo)).toBe('1 dia atrás');
  });

  it('should return formatted date for dates older than 30 days', () => {
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const result = pipe.transform(oldDate);
    // Should contain a date formatted (pt-BR style)
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
