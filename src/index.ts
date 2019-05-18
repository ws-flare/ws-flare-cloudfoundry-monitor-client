import { ApplicationConfig } from '@loopback/core';
import { CloudFoundryMonitorApplication } from './application';

// Get necessary configuration from environment variables
const {PORT, USER_API, PROJECTS_API, JOBS_API, MONITOR_API, AMQP_URL, AMQP_PORT, AMQP_USER, AMQP_PWD, JOB_ID, CF_API, CF_USER, CF_PASS, CF_ORG, CF_SPACE, CF_APPS, CF_MONITOR_ID, POD_NAME} = process.env;

/**
 * Main entry point for starting the service
 *
 * @param options - Server configurations
 */
export async function main(options: ApplicationConfig = {}): Promise<CloudFoundryMonitorApplication> {
    options.port = options.port || PORT;
    options.config = {
        jobId: JOB_ID,
        cfMonitorId: CF_MONITOR_ID,
        podName: POD_NAME
    };
    options.cf = {
        api: CF_API,
        user: CF_USER,
        pass: CF_PASS,
        org: CF_ORG,
        space: CF_SPACE,
        apps: CF_APPS
    };
    options.apis = {
        userApi: USER_API,
        projectsApi: PROJECTS_API,
        jobsApi: JOBS_API,
        monitorApi: MONITOR_API
    };
    options.amqp = {
        url: AMQP_URL,
        port: (options.amqp || {}).port || AMQP_PORT,
        user: AMQP_USER,
        pwd: AMQP_PWD
    };

    const app = new CloudFoundryMonitorApplication(options);

    await app.start();

    console.log(`Server is running on port ${app.options.port}`);
    return app;
}
