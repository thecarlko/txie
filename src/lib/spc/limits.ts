// Limits: upper/lower bounds per tool and analysis series.
export type Limit = { upper?: number; lower?: number }
export const LIMITS: Record<string, Record<string, Limit>> = {}

export const limitFor = (tool: string, id: string): Limit | undefined => LIMITS[tool]?.[id]
