export interface App {
    metadata: {
        guid: string;
        url: string;
        created_at: string;
        updated_at: string;
    },
    entity: {
        name: string;
        production: boolean;
        space_guid: string;
        stack_guid: string;
        buildpack: string;
        detected_buildpack: string;
        environment_json: string;
        memory: number;
        instances: number;
        disk_quota: number;
        state: 'STOPPED' | 'RUNNING' | 'CRASHED',
        version: string;
        command: string;
        console: boolean;
        staging_task_id: string;
        health_check_type: string;
        health_check_timeout: number;
        staging_failed_reason: string;
        staging_failed_description: string;
        diego: boolean;
        docker_image: string;
        docker_credentials: {
            username: string;
            password: string;
        },
        package_updated_at: string;
        detected_start_command: string;
        enable_ssh: boolean;
    }
}
