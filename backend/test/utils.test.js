const { generatePatientId } = require('../socket/utils');

describe('generatePatientId', () => {
    it('should return P01 for the first patient when lastId is null', () => {
        expect(generatePatientId(null)).toBe('P01');
    });

    it('should return P02 when the last ID was P01', () => {
        expect(generatePatientId('P01')).toBe('P02');
    });

    it('should correctly increment from P09 to P10', () => {
        expect(generatePatientId('P09')).toBe('P10');
    });

    it('should correctly increment from P99 to P100', () => {
        // The padStart(2, '0') will still work for numbers >= 100
        expect(generatePatientId('P99')).toBe('P100');
    });
});