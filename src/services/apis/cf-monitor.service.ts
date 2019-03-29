import { inject } from '@loopback/core';
import { post } from 'superagent';
import { AppStat } from '../../models/app-stat.model';
import { App } from '../../models/app.model';

export class CfMonitorService {

    @inject('api.monitor')
    private monitorApi: string;

    @inject('config.job.id')
    private jobId: string;

    async createUsage(app: App, appStat: AppStat, instance: string): Promise<any> {
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
