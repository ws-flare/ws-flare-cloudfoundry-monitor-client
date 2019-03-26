import { ApplicationConfig } from '@loopback/core';
import { CloudFoundryMonitorApplication } from './application';

const {PORT, USER_API, PROJECTS_API, JOBS_API, AMQP_URL, AMQP_PORT, AMQP_USER, AMQP_PWD, JOB_ID, CF_API, CF_USER, CF_PASS, CF_ORG, CF_SPACE} = process.env;

export async function main(options: ApplicationConfig = {}): Promise<CloudFoundryMonitorApplication> {
    options.port = options.port || PORT;
    options.config = {
        jobId: JOB_ID
    };
    options.cf = {
        api: CF_API,
        user: CF_USER,
        pass: CF_PASS,
        org: CF_ORG,
        space: CF_SPACE
    };
    options.apis = {
        userApi: USER_API,
        projectsApi: PROJECTS_API,
        jobsApi: JOBS_API
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
