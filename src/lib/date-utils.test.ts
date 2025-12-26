import { describe, it, expect } from 'vitest'
import { getMonthRange } from './date-utils'

describe('date-utils', () => {
    describe('getMonthRange', () => {
        it('should return default range (1-12) for anual period', () => {
            const result = getMonthRange('anual', 1)
            expect(result).toEqual({ monthStart: 1, monthEnd: 12 })
        })

        it('should return correct range for 1st semester', () => {
            const result = getMonthRange('semestral', 1)
            expect(result).toEqual({ monthStart: 1, monthEnd: 6 })
        })

        it('should return correct range for 2nd semester', () => {
            const result = getMonthRange('semestral', 2)
            expect(result).toEqual({ monthStart: 7, monthEnd: 12 })
        })

        it('should return correct range for Q1', () => {
            const result = getMonthRange('trimestral', 1)
            expect(result).toEqual({ monthStart: 1, monthEnd: 3 })
        })

        it('should return correct range for Q2', () => {
            const result = getMonthRange('trimestral', 2)
            expect(result).toEqual({ monthStart: 4, monthEnd: 6 })
        })

        it('should return correct range for Q3', () => {
            const result = getMonthRange('trimestral', 3)
            expect(result).toEqual({ monthStart: 7, monthEnd: 9 })
        })

        it('should return correct range for Q4', () => {
            const result = getMonthRange('trimestral', 4)
            expect(result).toEqual({ monthStart: 10, monthEnd: 12 })
        })

        it('should return correct range for specific month', () => {
            const result = getMonthRange('mensal', 5)
            expect(result).toEqual({ monthStart: 5, monthEnd: 5 })
        })
    })
})
