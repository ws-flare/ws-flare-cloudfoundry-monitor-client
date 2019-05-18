/**
 * Defines the attributes of an organization on cloud foundry
 */
export interface Org {
    metadata: {
        guid: string;
    },
    entity: {
        name: string;
        billing_enabled: boolean,
        quota_definition_guid: string,
        status: string,
        quota_definition_url: string,
        spaces_url: string,
        domains_url: string,
        private_domains_url: string,
        users_url: string,
        managers_url: string,
        billing_managers_url: string,
        auditors_url: string,
        app_events_url: string,
        space_quota_definitions_url: string
    }
}
