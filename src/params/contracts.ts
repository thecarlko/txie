// src/params/contracts.ts
import type { ParamMatcher } from '@sveltejs/kit';

export const match: ParamMatcher = (param) => {
    return param === 'contracts';
};