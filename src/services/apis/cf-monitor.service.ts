import { inject } from '@loopback/core';
import { post } from 'superagent';
import { AppStat } from '../../models/app-stat.model';
import { App } from '../../models/app.model';
import { Logger } from 'winston';

/**
 * Services for communicating with ws-flare-cloud-foundry-monitor-api
 */
export class CfMonitorService {

    @inject('logger')
    private logger: Logger;

    @inject('api.monitor')
    private monitorApi: string;

    @inject('config.job.id')
    private jobId: string;

    /**
     * Create a new usage statistic for an app on Cloud Foundry
     *
     * @param app - The app
     * @param appStat - The app statistics
     * @param instance - The app instance number
     */
    async createUsage(app: App, appStat: AppStat, instance: string): Promise<any> {
        this.logger.info('Logging usage');
        this.logger.info(app);
        this.logger.info(appStat);
        this.logger.info(`Instance: ${instance}`);

        return await post(`${this.monitorApi}/usages`).send({
            jobId: this.jobId,
            appId: app.metadata.guid,
            mem: appStat.stats.usage.mem,
            cpu: appStat.stats.usage.cpu,
            disk: appStat.stats.usage.disk,
            mem_quota: appStat.stats.mem_quota,
            disk_quota: appStat.stats.disk_quota,
            instance: parseInt(instance),
            time: appStat.stats.usage.time,
            state: appStat.state,
            uptime: appStat.stats.uptime,
            name: appStat.stats.name
        });
    }
}
