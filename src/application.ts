import { Application, ApplicationConfig } from '@loopback/core';
import { Client1_10, config } from 'kubernetes-client';
import { connect } from 'amqplib';
import { Server } from './server';
import { createLogger, transports } from 'winston';
import { CfControllerService } from './services/cloud-foundry/cf-controller.service';
import { AuthService } from './services/auth.service';
import { CfAuthService } from './services/cloud-foundry/cf-auth.service';
import { CfOrgsService } from './services/cloud-foundry/cf-orgs.service';
import { CfSpacesService } from './services/cloud-foundry/cf-spaces.service';
import { MonitorService } from './services/monitor.service';
import { CfAppsService } from './services/cloud-foundry/cf-apps.service';
import { CfStatsService } from './services/cloud-foundry/cf-stats.service';
import { CfMonitorService } from './services/apis/cf-monitor.service';

export class CloudFoundryMonitorApplication extends Application {

    constructor(options: ApplicationConfig = {}) {
        super(options);

        this.options.port = this.options.port || 3000;

        this.server(Server);

        const logger = createLogger({
            transports: [
                new transports.Console(),
            ],
        });

        // Logger
        this.bind('logger').to(logger);

        // Config
        this.bind('config.job.id').to(options.config.jobId);

        // CF
        this.bind('cf.api').to(options.cf.api);
        this.bind('cf.user').to(options.cf.user);
        this.bind('cf.pass').to(options.cf.pass);
        this.bind('cf.org').to(options.cf.org);
        this.bind('cf.space').to(options.cf.space);
        this.bind('cf.apps').to(options.cf.apps.split(','));

        // Remote APIS
        this.bind('api.user').to(options.apis.userApi);
        this.bind('api.projects').to(options.apis.projectsApi);
        this.bind('api.jobs').to(options.apis.jobsApi);
        this.bind('api.monitor').to(options.apis.monitorApi);

        // AMQP
        this.bind('amqp.url').to(options.amqp.url);
        this.bind('amqp.port').to(options.amqp.port);
        this.bind('amqp.user').to(options.amqp.user);
        this.bind('amqp.pwd').to(options.amqp.pwd);
        this.bind('amqp.conn').toDynamicValue(async () => await connect({
            hostname: options.amqp.url,
            port: options.amqp.port,
            username: options.amqp.user,
            password: options.amqp.pwd
        }));

        // Queues
        this.bind('queue.job.start').to('job.start');
        this.bind('queue.cfMonitor.ready').to(`cfMonitor.ready.${options.config.cfMonitorId}`);

        // Kubernetes
        this.bind('kubernetes.client').to(new Client1_10({config: config.getInCluster()}));

        // Services
        this.bind('services.cfController').toClass(CfControllerService);
        this.bind('services.cfAuth').toClass(CfAuthService);
        this.bind('services.cfOrgs').toClass(CfOrgsService);
        this.bind('services.cfSpaces').toClass(CfSpacesService);
        this.bind('services.cfApps').toClass(CfAppsService);
        this.bind('services.cfAppStats').toClass(CfStatsService);
        this.bind('services.auth').toClass(AuthService);
        this.bind('services.monitor').toClass(MonitorService);
        this.bind('services.cfMonitor').toClass(CfMonitorService);
    }

}
