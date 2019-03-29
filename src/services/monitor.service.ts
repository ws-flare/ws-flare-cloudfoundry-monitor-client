import { inject } from '@loopback/core';
import { Token } from '../models/token.model';
import { CfOrgsService } from './cloud-foundry/cf-orgs.service';
import { CfSpacesService } from './cloud-foundry/cf-spaces.service';
import { CfAppsService } from './cloud-foundry/cf-apps.service';
import { Logger } from 'winston';
import { Connection } from 'amqplib';
import { App } from '../models/app.model';

export class MonitorService {

    @inject('logger')
    private logger: Logger;

    @inject('services.cfOrgs')
    private cfOrgsService: CfOrgsService;

    @inject('services.cfSpaces')
    private cfSpacesService: CfSpacesService;

    @inject('services.cfApps')
    private cfAppsService: CfAppsService;

    @inject('amqp.conn')
    private amqpConn: Connection;

    @inject('queue.cfMonitor.ready')
    private cfMonitorReadyQueue: string;

    async monitor(token: Token): Promise<App[]> {
        const cfMonitorReadyChannel = await this.amqpConn.createChannel();

        await cfMonitorReadyChannel.assertQueue(this.cfMonitorReadyQueue);

        const org = await this.cfOrgsService.findOrg(token);

        this.logger.info(org);

        const space = await this.cfSpacesService.findSpace(token, org);

        this.logger.info(space);

        const apps = await this.cfAppsService.findApps(token, space);

        this.logger.info(apps);

        // Ready to start monitoring
        await cfMonitorReadyChannel.sendToQueue(this.cfMonitorReadyQueue, new Buffer((JSON.stringify({ready: true}))));

        return apps;
    }
}
