/**
 * Defines the attributes of a page object that Cloud Foundry API uses for pagination
 */
export interface Page<T> {
    total_results: number;
    total_pages: number;
    prev_url: string;
    next_url: string;
    resources: T[];
}

