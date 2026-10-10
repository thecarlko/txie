

type Specification = {
    id: string;
    name: string; // Hydrogen, Ammonia, etc.
    katex?: string;
}

type SpecificationRecord = Specification & {
    result: number;
    unit: string;

    unit_katex?: string;
    comparator?: string; // '<', '>', '<=', '>=', '=', '!='
}

// Example data
/**
id, name, katex, result, unit, unit_katex, comparator

*/

