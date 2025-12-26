/**
 * Calculates start and end months based on the period type and value.
 * Used for filtering database queries by date ranges.
 */
export function getMonthRange(period: string, periodValue: number): { monthStart: number, monthEnd: number } {
    let monthStart = 1
    let monthEnd = 12

    if (period === "semestral") {
        // 1st semester: Jan-Jun (1-6), 2nd semester: Jul-Dec (7-12)
        monthStart = periodValue === 1 ? 1 : 7
        monthEnd = periodValue === 1 ? 6 : 12
    } else if (period === "trimestral") {
        // Q1: 1-3, Q2: 4-6, Q3: 7-9, Q4: 10-12
        monthStart = (periodValue - 1) * 3 + 1
        monthEnd = periodValue * 3
    } else if (period === "mensal") {
        // Specific month
        monthStart = periodValue
        monthEnd = periodValue
    }

    return { monthStart, monthEnd }
}
