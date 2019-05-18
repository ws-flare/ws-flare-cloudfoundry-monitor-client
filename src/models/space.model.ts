/**
 * Defines the attributes of a Space on Cloud Foundry
 */
export interface Space {
    metadata: {
        guid: string;
        url: string;
        created_at: string;
        updated_at: string;
    },
    entity: {
        name: string,
        organization_guid: string,
        space_quota_definition_guid: string,
        allow_ssh: boolean,
    }
}
